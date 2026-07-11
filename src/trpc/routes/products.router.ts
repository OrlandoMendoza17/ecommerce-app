import { router, publicProcedure, protectedProcedure } from "@/trpc";
import { vProduct } from '@/validations/products.validations'
import { applyCustomFilters } from '@/utils/supabase/filters'
import { attachDefaultVariantsToProducts } from '@/utils/products/attachDefaultVariants'
import {
  countStoreCatalogProducts,
  listStoreCatalogProducts,
} from '@/utils/products/storeCatalog'

const productFilters = ['category_id', 'is_active', 'is_featured', 'is_digital', 'created_at'] as const

export const productRouter = router({
  count: publicProcedure
    .input(vProduct.count())
    .query(async (options) => {
      const { input, ctx } = options
      const { filters: customFilters, q } = input

      let query = ctx.supabase
        .from('products')
        .select('id', { count: 'estimated', head: true })

      query = applyCustomFilters(query, customFilters, undefined, [...productFilters])

      if (q) {
        query = query.or(
          `name.ilike.%${q}%,slug.ilike.%${q}%,description.ilike.%${q}%,brand.ilike.%${q}%`
        )
      }

      const { error, count } = await query
      if (error) throw new Error(error.message)
      return count ?? 0
    }),

  selectByRange: publicProcedure
    .input(vProduct.selectByRange())
    .query(async (options): Promise<Product[]> => {
      const { input, ctx } = options
      const { from, to, filters: customFilters, q } = input

      let query = ctx.supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      query = applyCustomFilters(query, customFilters, undefined, [...productFilters])

      if (q) {
        query = query.or(
          `name.ilike.%${q}%,slug.ilike.%${q}%,description.ilike.%${q}%,brand.ilike.%${q}%`
        )
      }

      query = query.range(from, to)
      const { data, error } = await query
      if (error) throw new Error(error.message)

      return attachDefaultVariantsToProducts(
        ctx.supabase,
        (data ?? []) as unknown as Product[]
      )
    }),

  select: publicProcedure.input(vProduct.select()).query(async (options): Promise<Product[]> => {
    const { input, ctx } = options
    const { search, category_id, is_active, is_featured, brand, condition, tags } = input

    let query = ctx.supabase
      .from('products')
      .select('*')

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,slug.ilike.%${search}%,description.ilike.%${search}%,brand.ilike.%${search}%`
      )
    }

    if (category_id !== undefined) {
      if (category_id === null) {
        query = query.is('category_id', null)
      } else {
        query = query.eq('category_id', category_id)
      }
    }

    if (is_active !== undefined) query = query.eq('is_active', is_active)
    if (is_featured !== undefined) query = query.eq('is_featured', is_featured)
    if (brand) query = query.eq('brand', brand)
    if (condition) query = query.eq('condition', condition)
    if (tags && tags.length > 0) query = query.overlaps('tags', tags)

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return attachDefaultVariantsToProducts(
      ctx.supabase,
      (data ?? []) as unknown as Product[]
    )
  }),

  getById: publicProcedure
    .input(vProduct.getById())
    .query(async (options): Promise<Product | null> => {
      const { input, ctx } = options
      const { data, error } = await ctx.supabase
        .from('products')
        .select('*')
        .eq('id', input.id)
        .limit(1)

      if (error) {
        if (error.code === 'PGRST116') return null
        throw new Error(error.message)
      }

      return (data?.[0] ?? null) as unknown as Product | null
    }),

  getBySlug: publicProcedure
    .input(vProduct.getBySlug())
    .query(async (options): Promise<Product | null> => {
      const { input, ctx } = options
      const { data, error } = await ctx.supabase
        .from('products')
        .select('*')
        .eq('slug', input.slug)
        .eq('is_active', true)
        .limit(1)

      if (error) {
        if (error.code === 'PGRST116') return null
        throw new Error(error.message)
      }

      const product = (data?.[0] ?? null) as unknown as Product | null
      if (!product) return null

      const [enriched] = await attachDefaultVariantsToProducts(ctx.supabase, [product])
      return enriched
    }),

  insert: protectedProcedure
    .input(vProduct.insert())
    .mutation(async (options) => {
      const { input, ctx } = options
      if (!ctx.user) throw new Error('User not authenticated')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await ctx.supabase
        .from('products')
        .insert(input as any)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data as unknown as Product
    }),

  update: protectedProcedure
    .input(vProduct.update())
    .mutation(async (options) => {
      const { input, ctx } = options
      const { id } = input

      const updated_at = new Date().toISOString()
      const updatedProduct = { ...input, updated_at }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await ctx.supabase
        .from('products')
        .update(updatedProduct as any)
        .eq('id', id)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data as unknown as Product
    }),

  delete: protectedProcedure
    .input(vProduct.delete())
    .mutation(async (options) => {
      const { input, ctx } = options
      const { id } = input

      const { error } = await ctx.supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw new Error(error.message)
    }),

  storeCatalogCount: publicProcedure
    .input(vProduct.storeCatalogCount())
    .query(async ({ input, ctx }) => {
      return countStoreCatalogProducts(ctx.supabase, {
        q: input.q,
        category_id: input.category_id,
        is_featured: input.is_featured,
        price_min: input.price_min,
        price_max: input.price_max,
        in_stock_only: input.in_stock_only,
      });
    }),

  storeCatalogList: publicProcedure
    .input(vProduct.storeCatalogList())
    .query(async ({ input, ctx }): Promise<Product[]> => {
      const products = await listStoreCatalogProducts(ctx.supabase, {
        q: input.q,
        category_id: input.category_id,
        is_featured: input.is_featured,
        price_min: input.price_min,
        price_max: input.price_max,
        in_stock_only: input.in_stock_only,
        sort: input.sort,
        from: input.from,
        to: input.to,
      });

      return attachDefaultVariantsToProducts(ctx.supabase, products);
    }),
})
