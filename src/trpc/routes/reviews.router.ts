import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure } from '@/trpc';
import { vReview } from '@/validations/reviews.validations';
import { parseProductImages } from '@/utils/products/parseProductImages';
import { createServiceClient } from '@/utils/supabase/supabase.service';
import { applyCustomFilters } from '@/utils/supabase/filters';

const QUALIFYING_STATUSES = ['payment_confirmed', 'shipped', 'delivered'] as const;
const reviewAdminFilters = ['is_approved', 'rating', 'created_at', 'profile_id'] as const;

const REVIEW_SEARCH_OR = (q: string) =>
  `title.ilike.%${q}%,comment.ilike.%${q}%`;

async function recalcStats(productId: string) {
  const service = createServiceClient();
  await service.rpc('recalculate_product_review_stats', {
    p_product_id: productId,
  });
}

function emptyRatingCounts(): ProductReviewSummary["counts"] {
  return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
}

export const reviewsRouter = router({
  getProductSummary: publicProcedure
    .input(vReview.getProductSummary())
    .query(async ({ ctx, input }): Promise<ProductReviewSummary> => {
      const [statsRes, ratingsRes, commentsRes] = await Promise.all([
        ctx.supabase
          .from("product_stats")
          .select("total_reviews, average_rating")
          .eq("product_id", input.product_id)
          .maybeSingle(),
        ctx.supabase
          .from("reviews")
          .select("rating")
          .eq("product_id", input.product_id)
          .eq("is_approved", true),
        ctx.supabase
          .from("reviews")
          .select("id", { count: "exact", head: true })
          .eq("product_id", input.product_id)
          .eq("is_approved", true)
          .neq("comment", ""),
      ]);

      if (ratingsRes.error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: ratingsRes.error.message,
        });
      }
      if (commentsRes.error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: commentsRes.error.message,
        });
      }

      const counts = emptyRatingCounts();
      for (const row of ratingsRes.data ?? []) {
        const rating = row.rating as ReviewRatingFilter;
        if (rating >= 1 && rating <= 5) counts[rating] += 1;
      }

      const computedTotal = Object.values(counts).reduce((sum, n) => sum + n, 0);
      const computedAvg =
        computedTotal > 0
          ? (counts[1] + counts[2] * 2 + counts[3] * 3 + counts[4] * 4 + counts[5] * 5) /
          computedTotal
          : 0;

      return {
        average_rating: Number(statsRes.data?.average_rating ?? computedAvg),
        total_ratings: statsRes.data?.total_reviews ?? computedTotal,
        total_comments: commentsRes.count ?? 0,
        counts,
      };
    }),

  listByProduct: publicProcedure
    .input(vReview.listByProduct())
    .query(async ({ ctx, input }): Promise<ProductReviewListResult> => {
      const { product_id, from, to, rating, sort } = input;

      let query = ctx.supabase
        .from("reviews")
        .select("id, rating, title, comment, created_at", { count: "exact" })
        .eq("product_id", product_id)
        .eq("is_approved", true)
        .neq("comment", "");

      if (rating) {
        query = query.eq("rating", rating);
      }

      if (sort === "rating_desc") {
        query = query
          .order("rating", { ascending: false })
          .order("created_at", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data, error, count } = await query.range(from, to);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return {
        items: (data ?? []).map((row) => ({
          id: row.id,
          rating: row.rating,
          title: row.title ?? "",
          comment: row.comment ?? "",
          created_at: row.created_at,
        })),
        total: count ?? 0,
      };
    }),

  countPending: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    // 1. All qualifying order_items for this user
    const { data: orderItems, error: itemsError } = await ctx.supabase
      .from('order_items')
      .select('product_id, order_id:order_id, orders!inner(profile_id, status)')
      .eq('orders.profile_id', userId)
      .in('orders.status', [...QUALIFYING_STATUSES]);

    if (itemsError) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: itemsError.message });

    // 2. Already reviewed product_ids by this user
    const { data: existingReviews, error: reviewsError } = await ctx.supabase
      .from('reviews')
      .select('product_id')
      .eq('profile_id', userId);

    if (reviewsError) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: reviewsError.message });

    const reviewedIds = new Set((existingReviews ?? []).map((r) => r.product_id));

    // 3. Deduplicate by product_id and exclude already reviewed
    const seen = new Set<string>();
    for (const item of orderItems ?? []) {
      if (!reviewedIds.has(item.product_id) && !seen.has(item.product_id)) {
        seen.add(item.product_id);
      }
    }

    return seen.size;
  }),

  listPending: protectedProcedure
    .input(vReview.paginated())
    .query(async ({ ctx, input }): Promise<ReviewPendingItem[]> => {
      const userId = ctx.user.id;
      const { from, to } = input;

      // 1. All qualifying order_items
      const { data: orderItems, error: itemsError } = await ctx.supabase
        .from('order_items')
        .select(`
          product_id,
          product_name,
          product_image_url,
          order_id,
          orders!inner(profile_id, status, created_at)
        `)
        .eq('orders.profile_id', userId)
        .in('orders.status', [...QUALIFYING_STATUSES])
        .order('order_id', { ascending: false });

      if (itemsError) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: itemsError.message });

      // 2. Already reviewed
      const { data: existingReviews, error: reviewsError } = await ctx.supabase
        .from('reviews')
        .select('product_id')
        .eq('profile_id', userId);

      if (reviewsError) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: reviewsError.message });

      const reviewedIds = new Set((existingReviews ?? []).map((r) => r.product_id));

      // 3. Deduplicate by product_id, keep first occurrence (most recent order)
      const seen = new Set<string>();
      const pending: ReviewPendingItem[] = [];

      for (const item of orderItems ?? []) {
        if (reviewedIds.has(item.product_id) || seen.has(item.product_id)) continue;
        seen.add(item.product_id);

        const order = Array.isArray(item.orders) ? item.orders[0] : item.orders;
        pending.push({
          product_id: item.product_id,
          product_name: item.product_name ?? '',
          product_image_url: item.product_image_url ?? '',
          order_id: item.order_id,
          purchased_at: (order as { created_at?: string })?.created_at ?? '',
        });
      }

      // 4. Paginate in JS (data set is typically small per user)
      return pending.slice(from, to + 1);
    }),

  countCompleted: protectedProcedure.query(async ({ ctx }) => {
    const { count, error } = await ctx.supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', ctx.user.id);

    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
    return count ?? 0;
  }),

  listCompleted: protectedProcedure
    .input(vReview.paginated())
    .query(async ({ ctx, input }): Promise<ReviewCompletedItem[]> => {
      const userId = ctx.user.id;
      const { from, to } = input;

      const { data, error } = await ctx.supabase
        .from('reviews')
        .select(`
          id,
          product_id,
          rating,
          title,
          comment,
          is_approved,
          created_at,
          updated_at,
          products(name, images, slug)
        `)
        .eq('profile_id', userId)
        .order('updated_at', { ascending: false })
        .range(from, to);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      return (data ?? []).map((row) => {
        const product = Array.isArray(row.products) ? row.products[0] : row.products;
        const images = parseProductImages((product as { images?: unknown })?.images);
        return {
          id: row.id,
          product_id: row.product_id,
          rating: row.rating,
          title: row.title ?? '',
          comment: row.comment ?? '',
          is_approved: row.is_approved,
          created_at: row.created_at,
          updated_at: row.updated_at,
          product_name: (product as { name?: string })?.name ?? '',
          product_image_url: images[0] ?? '',
          product_slug: (product as { slug?: string })?.slug ?? '',
        } satisfies ReviewCompletedItem;
      });
    }),

  getById: protectedProcedure
    .input(vReview.getById())
    .query(async ({ ctx, input }): Promise<ReviewDetail> => {
      const { data, error } = await ctx.supabase
        .from('reviews')
        .select(`
          id,
          product_id,
          profile_id,
          rating,
          title,
          comment,
          is_approved,
          created_at,
          updated_at,
          products(name, images, slug)
        `)
        .eq('id', input.id)
        .single();

      if (error || !data) throw new TRPCError({ code: 'NOT_FOUND', message: 'Reseña no encontrada' });

      if (data.profile_id !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No tienes acceso a esta reseña' });
      }

      const product = Array.isArray(data.products) ? data.products[0] : data.products;
      const images = parseProductImages((product as { images?: unknown })?.images);

      return {
        id: data.id,
        product_id: data.product_id,
        rating: data.rating,
        title: data.title ?? '',
        comment: data.comment ?? '',
        is_approved: data.is_approved,
        created_at: data.created_at,
        updated_at: data.updated_at,
        product_name: (product as { name?: string })?.name ?? '',
        product_image_url: images[0] ?? '',
        product_slug: (product as { slug?: string })?.slug ?? '',
      } satisfies ReviewDetail;
    }),

  insert: protectedProcedure
    .input(vReview.insert())
    .mutation(async ({ ctx, input }): Promise<{ id: string }> => {
      const userId = ctx.user.id;

      const { data, error } = await ctx.supabase
        .from('reviews')
        .insert({
          product_id: input.product_id,
          profile_id: userId,
          order_id: input.order_id ?? null,
          rating: input.rating,
          title: '',
          comment: '',
        })
        .select('id')
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new TRPCError({ code: 'CONFLICT', message: 'Ya existe una reseña para este producto' });
        }
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }

      await recalcStats(input.product_id);

      return { id: data.id };
    }),

  update: protectedProcedure
    .input(vReview.update())
    .mutation(async ({ ctx, input }) => {
      const { id, ...fields } = input;
      const now = new Date().toISOString();

      const { data: existing, error: fetchError } = await ctx.supabase
        .from('reviews')
        .select('product_id')
        .eq('id', id)
        .eq('profile_id', ctx.user.id)
        .single();

      if (fetchError || !existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Reseña no encontrada' });
      }

      const { error } = await ctx.supabase
        .from('reviews')
        .update({ ...fields, updated_at: now })
        .eq('id', id)
        .eq('profile_id', ctx.user.id);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      await recalcStats(existing.product_id);

      return { success: true };
    }),

  delete: protectedProcedure
    .input(vReview.delete())
    .mutation(async ({ ctx, input }) => {
      const { data: existing, error: fetchError } = await ctx.supabase
        .from('reviews')
        .select('product_id')
        .eq('id', input.id)
        .eq('profile_id', ctx.user.id)
        .single();

      if (fetchError || !existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Reseña no encontrada' });
      }

      const { error } = await ctx.supabase
        .from('reviews')
        .delete()
        .eq('id', input.id)
        .eq('profile_id', ctx.user.id);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      await recalcStats(existing.product_id);

      return { success: true };
    }),

  count: protectedProcedure
    .input(vReview.count())
    .query(async ({ ctx, input }) => {
      const { filters: customFilters, q } = input;

      let query = ctx.supabase
        .from('reviews')
        .select('id', { count: 'estimated', head: true });

      query = applyCustomFilters(query, customFilters, undefined, [...reviewAdminFilters]);

      if (q?.trim()) {
        query = query.or(REVIEW_SEARCH_OR(q.trim()));
      }

      const { error, count } = await query;
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return count ?? 0;
    }),

  selectByRange: protectedProcedure
    .input(vReview.selectByRange())
    .query(async ({ ctx, input }): Promise<ReviewAdminItem[]> => {
      const { from, to, filters: customFilters, q } = input;

      let query = ctx.supabase
        .from('reviews')
        .select(`
          id,
          product_id,
          profile_id,
          rating,
          title,
          comment,
          is_approved,
          created_at,
          updated_at,
          products(name, images, slug),
          profiles(full_name, email)
        `)
        .order('created_at', { ascending: false });

      query = applyCustomFilters(query, customFilters, undefined, [...reviewAdminFilters]);

      if (q?.trim()) {
        query = query.or(REVIEW_SEARCH_OR(q.trim()));
      }

      query = query.range(from, to);
      const { data, error } = await query;
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      return (data ?? []).map((row) => {
        const product = Array.isArray(row.products) ? row.products[0] : row.products;
        const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
        const images = parseProductImages((product as { images?: unknown } | null)?.images);

        return {
          id: row.id,
          product_id: row.product_id,
          profile_id: row.profile_id,
          rating: row.rating,
          title: row.title ?? '',
          comment: row.comment ?? '',
          is_approved: row.is_approved,
          created_at: row.created_at,
          updated_at: row.updated_at,
          product_name: (product as { name?: string } | null)?.name ?? '',
          product_image_url: images[0] ?? '',
          product_slug: (product as { slug?: string } | null)?.slug ?? '',
          customer_name: (profile as { full_name?: string } | null)?.full_name ?? '',
          customer_email: (profile as { email?: string } | null)?.email ?? '',
        } satisfies ReviewAdminItem;
      });
    }),

  setApproved: protectedProcedure
    .input(vReview.setApproved())
    .mutation(async ({ ctx, input }) => {
      const { data: existing, error: fetchError } = await ctx.supabase
        .from('reviews')
        .select('product_id')
        .eq('id', input.id)
        .single();

      if (fetchError || !existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Reseña no encontrada' });
      }

      const { error } = await ctx.supabase
        .from('reviews')
        .update({
          is_approved: input.is_approved,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.id);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      await recalcStats(existing.product_id);

      return { success: true };
    }),

  deleteAdmin: protectedProcedure
    .input(vReview.delete())
    .mutation(async ({ ctx, input }) => {
      const { data: existing, error: fetchError } = await ctx.supabase
        .from('reviews')
        .select('product_id')
        .eq('id', input.id)
        .single();

      if (fetchError || !existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Reseña no encontrada' });
      }

      const { error } = await ctx.supabase
        .from('reviews')
        .delete()
        .eq('id', input.id);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      await recalcStats(existing.product_id);

      return { success: true };
    }),
});
