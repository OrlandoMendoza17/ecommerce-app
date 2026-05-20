import { router, publicProcedure, protectedProcedure } from "@/trpc";
import { vAddress } from '@/validations/addresses.validations'
import { applyCustomFilters } from '@/utils/supabase/filters'
import type { Tables } from '@/lib/database.types'
import type { TRPCContext } from '@/trpc/trpc.context'

type Address = Tables<'addresses'>

const addressFilters = ['profile_id', 'is_default', 'country', 'city'] as const

async function unsetOtherDefaultAddresses(
  supabase: TRPCContext['supabase'],
  profileId: string,
  excludeId?: string
) {
  let query = supabase
    .from('addresses')
    .update({ is_default: false })
    .eq('profile_id', profileId)
    .eq('is_default', true)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { error } = await query
  if (error) throw new Error(error.message)
}

export const addressRouter = router({
  count: publicProcedure
    .input(vAddress.count())
    .query(async (options) => {
      const { input, ctx } = options
      const { filters: customFilters, q } = input

      let query = ctx.supabase
        .from('addresses')
        .select('id', { count: 'estimated', head: true })

      query = applyCustomFilters(query, customFilters, undefined, [...addressFilters])

      if (q) {
        query = query.or(
          `full_name.ilike.%${q}%,phone.ilike.%${q}%,address_line1.ilike.%${q}%,city.ilike.%${q}%,state.ilike.%${q}%,postal_code.ilike.%${q}%,country.ilike.%${q}%`
        )
      }

      const { error, count } = await query
      if (error) throw new Error(error.message)
      return count ?? 0
    }),

  selectByRange: publicProcedure
    .input(vAddress.selectByRange())
    .query(async (options) => {
      const { input, ctx } = options
      const { from, to, filters: customFilters, q } = input

      let query = ctx.supabase
        .from('addresses')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      query = applyCustomFilters(query, customFilters, undefined, [...addressFilters])

      if (q) {
        query = query.or(
          `full_name.ilike.%${q}%,phone.ilike.%${q}%,address_line1.ilike.%${q}%,city.ilike.%${q}%,state.ilike.%${q}%,postal_code.ilike.%${q}%,country.ilike.%${q}%`
        )
      }

      query = query.range(from, to)
      const { data, error } = await query.overrideTypes<Address[]>()
      if (error) throw new Error(error.message)

      return data ?? []
    }),

  select: publicProcedure.input(vAddress.select()).query(async (options) => {
    const { input, ctx } = options
    const { search, is_default } = input

    let query = ctx.supabase
      .from('addresses')
      .select('*')

    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,phone.ilike.%${search}%,address_line1.ilike.%${search}%,city.ilike.%${search}%,state.ilike.%${search}%,postal_code.ilike.%${search}%,country.ilike.%${search}%`
      )
    }

    if (is_default !== undefined) {
      query = query.eq('is_default', is_default)
    }

    const { data, error } = await query
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })
      .overrideTypes<Address[]>()

    if (error) {
      throw new Error(error.message)
    }

    return data
  }),

  getById: publicProcedure
    .input(vAddress.getById())
    .query(async (options) => {
      const { input, ctx } = options
      const { data, error } = await ctx.supabase
        .from('addresses')
        .select('*')
        .eq('id', input.id)
        .limit(1)
        .overrideTypes<Address[]>()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        throw new Error(error.message)
      }

      return data[0]
    }),

  insert: protectedProcedure
    .input(vAddress.insert())
    .mutation(async (options) => {
      const { input, ctx } = options
      if (!ctx.user) {
        throw new Error('User not authenticated')
      }

      const profile_id = ctx.user.id

      if (input.is_default) {
        await unsetOtherDefaultAddresses(ctx.supabase, profile_id)
      }

      const { data, error } = await ctx.supabase
        .from('addresses')
        .insert({ ...input, profile_id })
        .select()
        .single()
        .overrideTypes<Address>()

      if (error) {
        throw new Error(error.message)
      }

      return data
    }),

  update: protectedProcedure
    .input(vAddress.update())
    .mutation(async (options) => {
      const { input, ctx } = options
      const { id } = input

      if (!ctx.user) {
        throw new Error('User not authenticated')
      }

      if (input.is_default) {
        await unsetOtherDefaultAddresses(ctx.supabase, ctx.user.id, id)
      }

      const updated_at = new Date().toISOString()
      const updatedAddress = { ...input, updated_at }

      const { data, error } = await ctx.supabase
        .from('addresses')
        .update(updatedAddress)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    }),

  delete: protectedProcedure
    .input(vAddress.delete())
    .mutation(async (options) => {
      const { input, ctx } = options
      const { id } = input

      const { error } = await ctx.supabase
        .from('addresses')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(error.message)
      }
    }),
})
