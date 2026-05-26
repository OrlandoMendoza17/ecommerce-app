import { router, publicProcedure, protectedProcedure } from "@/trpc";
import { vProduct } from '@/validations/products.validations'
import { applyCustomFilters } from '@/utils/supabase/filters'

const productFilters = ['category_id', 'is_active', 'is_featured', 'allow_backorder'] as const

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
          `name.ilike.%${q}%,slug.ilike.%${q}%,description.ilike.%${q}%,sku.ilike.%${q}%`
        )
      }

      const { error, count } = await query
      if (error) throw new Error(error.message)
      return count ?? 0
    }),

  selectByRange: publicProcedure
    .input(vProduct.selectByRange())
    .query(async (options) => {
      const { input, ctx } = options
      const { from, to, filters: customFilters, q } = input

      let query = ctx.supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      query = applyCustomFilters(query, customFilters, undefined, [...productFilters])

      if (q) {
        query = query.or(
          `name.ilike.%${q}%,slug.ilike.%${q}%,description.ilike.%${q}%,sku.ilike.%${q}%`
        )
      }

      query = query.range(from, to)
      const { data, error } = await query.overrideTypes<Product[]>()
      if (error) throw new Error(error.message)

      return data ?? []
    }),

  select: publicProcedure.input(vProduct.select()).query(async (options) => {
    const { input, ctx } = options
    const { search, category_id, is_active, is_featured } = input

    let query = ctx.supabase
      .from('products')
      .select('*')

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,slug.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`
      )
    }

    if (category_id !== undefined) {
      if (category_id === null) {
        query = query.is('category_id', null)
      } else {
        query = query.eq('category_id', category_id)
      }
    }

    if (is_active !== undefined) {
      query = query.eq('is_active', is_active)
    }

    if (is_featured !== undefined) {
      query = query.eq('is_featured', is_featured)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .overrideTypes<Product[]>()

    if (error) {
      throw new Error(error.message)
    }

    return data
  }),

  getById: publicProcedure
    .input(vProduct.getById())
    .query(async (options) => {
      const { input, ctx } = options
      const { data, error } = await ctx.supabase
        .from('products')
        .select('*')
        .eq('id', input.id)
        .limit(1)
        .overrideTypes<Product[]>()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        throw new Error(error.message)
      }

      return data[0]
    }),

  insert: protectedProcedure
    .input(vProduct.insert())
    .mutation(async (options) => {
      const { input, ctx } = options
      if (!ctx.user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await ctx.supabase
        .from('products')
        .insert(input)
        .select()
        .single()
        .overrideTypes<Product>()

      if (error) {
        throw new Error(error.message)
      }

      return data
    }),

  update: protectedProcedure
    .input(vProduct.update())
    .mutation(async (options) => {
      const { input, ctx } = options
      const { id } = input

      const updated_at = new Date().toISOString()
      const updatedProduct = { ...input, updated_at }

      const { data, error } = await ctx.supabase
        .from('products')
        .update(updatedProduct)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
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

      if (error) {
        throw new Error(error.message)
      }
    }),
})
