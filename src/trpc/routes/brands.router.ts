import { router, publicProcedure, protectedProcedure } from "@/trpc";
import { vBrand } from "@/validations/brands.validations";
import { applyCustomFilters } from "@/utils/supabase/filters";

const brandFilters = ["is_active", "created_at"] as const;

export const brandRouter = router({
  count: publicProcedure.input(vBrand.count()).query(async (options) => {
    const { input, ctx } = options;
    const { filters: customFilters, q } = input;

    let query = ctx.supabase
      .from("brands")
      .select("id", { count: "estimated", head: true });

    query = applyCustomFilters(query, customFilters, undefined, [...brandFilters]);

    if (q) {
      query = query.ilike("name", `%${q}%`);
    }

    const { error, count } = await query;
    if (error) throw new Error(error.message);
    return count ?? 0;
  }),

  selectByRange: publicProcedure
    .input(vBrand.selectByRange())
    .query(async (options) => {
      const { input, ctx } = options;
      const { from, to, filters: customFilters, q } = input;

      let query = ctx.supabase
        .from("brands")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      query = applyCustomFilters(query, customFilters, undefined, [...brandFilters]);

      if (q) {
        query = query.ilike("name", `%${q}%`);
      }

      query = query.range(from, to);
      const { data, error } = await query.overrideTypes<Brand[]>();
      if (error) throw new Error(error.message);

      return data ?? [];
    }),

  select: publicProcedure.input(vBrand.select()).query(async (options) => {
    const { input, ctx } = options;
    const { search, is_active } = input;

    let query = ctx.supabase.from("brands").select("*");

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    if (is_active !== undefined) {
      query = query.eq("is_active", is_active);
    }

    const { data, error } = await query
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false })
      .overrideTypes<Brand[]>();

    if (error) throw new Error(error.message);

    return data;
  }),

  getById: publicProcedure.input(vBrand.getById()).query(async (options) => {
    const { input, ctx } = options;
    const { data, error } = await ctx.supabase
      .from("brands")
      .select("*")
      .eq("id", input.id)
      .limit(1)
      .overrideTypes<Brand[]>();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(error.message);
    }

    return data[0];
  }),

  insert: protectedProcedure.input(vBrand.insert()).mutation(async (options) => {
    const { input, ctx } = options;
    if (!ctx.user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await ctx.supabase
      .from("brands")
      .insert(input)
      .select()
      .single()
      .overrideTypes<Brand>();

    if (error) throw new Error(error.message);

    return data;
  }),

  update: protectedProcedure.input(vBrand.update()).mutation(async (options) => {
    const { input, ctx } = options;
    const { id } = input;

    const updated_at = new Date().toISOString();
    const updatedBrand = { ...input, updated_at };

    const { data, error } = await ctx.supabase
      .from("brands")
      .update(updatedBrand)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return data;
  }),

  delete: protectedProcedure.input(vBrand.delete()).mutation(async (options) => {
    const { input, ctx } = options;
    const { id } = input;
    const { error } = await ctx.supabase.from("brands").delete().eq("id", id);

    if (error) throw new Error(error.message);
  }),
});
