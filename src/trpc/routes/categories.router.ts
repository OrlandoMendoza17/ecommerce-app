import { router, publicProcedure, protectedProcedure } from "@/trpc";
import { vCategory } from '@/validations/categories.validations'
import { applyCustomFilters } from '@/utils/supabase/filters'

const categoryFilters = ['parent_id', 'is_active', 'created_at'] as const

export const categoryRouter = router({
  count: publicProcedure
    .input(vCategory.count())
    .query(async (options) => {
      const { input, ctx } = options
      const { filters: customFilters, q } = input

      let query = ctx.supabase
        .from('categories')
        .select('id', { count: 'estimated', head: true })

      query = applyCustomFilters(query, customFilters, undefined, [...categoryFilters])

      if (q) {
        query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%,slug.ilike.%${q}%`)
      }

      const { error, count } = await query
      if (error) throw new Error(error.message)
      return count ?? 0
    }),

  selectByRange: publicProcedure
    .input(vCategory.selectByRange())
    .query(async (options) => {
      const { input, ctx } = options
      const { from, to, filters: customFilters, q } = input

      let query = ctx.supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })

      query = applyCustomFilters(query, customFilters, undefined, [...categoryFilters])

      if (q) {
        query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%,slug.ilike.%${q}%`)
      }

      query = query.range(from, to)
      const { data, error } = await query.overrideTypes<Category[]>()
      if (error) throw new Error(error.message)

      return data ?? []
    }),

  select: publicProcedure.input(vCategory.select()).query(async (options) => {
    const { input, ctx } = options
    const { search, parent_id, is_active } = input

    let query = ctx.supabase
      .from('categories')
      .select('*')

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,slug.ilike.%${search}%`)
    }

    if (parent_id) {
      query = query.eq('parent_id', parent_id)
    }

    if (is_active !== undefined) {
      query = query.eq('is_active', is_active)
    }

    const { data, error } = await query
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })
      .overrideTypes<Category[]>()

    if (error) {
      throw new Error(error.message)
    }

    return data;
  }),

  getById: publicProcedure
    .input(vCategory.getById())
    .query(async (options) => {
      const { input, ctx } = options
      const { data, error } = await ctx.supabase
        .from('categories')
        .select('*')
        .eq('id', input.id)
        .limit(1)
        .overrideTypes<Category[]>()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        throw new Error(error.message)
      }

      return data[0];
    }),

  insert: protectedProcedure
    .input(vCategory.insert())
    .mutation(async (options) => {
      const { input, ctx } = options
      if (!ctx.user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await ctx.supabase
        .from('categories')
        .insert(input)
        .select()
        .single()
        .overrideTypes<Category>()

      if (error) {
        throw new Error(error.message)
      }

      return data
    }),

  update: protectedProcedure
    .input(vCategory.update())
    .mutation(async options => {
      const { input, ctx } = options
      const { id } = input

      const updated_at = new Date().toISOString()
      const updatedCategory = { ...input, updated_at }

      const { data, error } = await ctx.supabase
        .from('categories')
        .update(updatedCategory)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    }),

  delete: protectedProcedure
    .input(vCategory.delete())
    .mutation(async options => {
      const { input, ctx } = options
      const { id } = input
      const { error } = await ctx.supabase
        .from('categories')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(error.message)
      }
    }),
})
