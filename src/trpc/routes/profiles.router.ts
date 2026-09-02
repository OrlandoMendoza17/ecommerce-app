import "server-only";

import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "@/trpc";
import { vProfile } from '@/validations/profile.validations'
import { applyCustomFilters } from '@/utils/supabase/filters'
import type { Tables } from '@/lib/database.types'

type Profile = Tables<'profiles'>

const profileFilters = ['is_admin', 'created_at'] as const

export const profileRouter = router({
  count: publicProcedure
    .input(vProfile.count())
    .query(async (options) => {
      const { input, ctx } = options;
      const { filters: customFilters, q } = input;

      let query = ctx.supabase
        .from('profiles')
        .select('id', { count: 'estimated', head: true })
        .is('deleted_at', null);

      query = applyCustomFilters(query, customFilters, undefined, [...profileFilters]);

      if (q) {
        query = query.or(
          `full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`
        );
      }

      const { error, count } = await query;
      if (error) throw new Error(error.message);
      return count ?? 0;
    }),

  selectByRange: publicProcedure
    .input(vProfile.selectByRange())
    .query(async (options) => {
      const { input, ctx } = options;
      const { from, to, filters: customFilters, q } = input;

      let query = ctx.supabase
        .from('profiles')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
        .range(from, to);

      query = applyCustomFilters(query, customFilters, undefined, [...profileFilters]);

      if (q) {
        query = query.or(
          `full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`
        );
      }

      const { data, error } = await query.overrideTypes<Profile[]>();
      if (error) throw new Error(error.message);
      return data ?? [];
    }),

  select: publicProcedure.input(vProfile.select()).query(async (options) => {
    const { input, ctx } = options
    const { search } = input
    const { user } = ctx

    let query = ctx.supabase
      .from('profiles')
      .select('*')
      .is('deleted_at', null)

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    if (user?.id) {
      query = query.neq('id', user.id)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .overrideTypes<Profile[]>()

    if (error) {
      throw new Error(error.message)
    }

    return data;
  }),

  getById: publicProcedure
    .input(vProfile.getById())
    .query(async (options) => {
      const { input, ctx } = options
      const { data, error } = await ctx.supabase
        .from('profiles')
        .select('*')
        .eq('id', input.id)
        .is('deleted_at', null)
        .limit(1)
        .overrideTypes<Profile[]>()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        throw new Error(error.message)
      }

      return data[0] ?? null;
    }),

  insert: publicProcedure
    .input(vProfile.insert())
    .mutation(async (options) => {
      const { input, ctx } = options

      console.log("input", input)

      const { error } = await ctx.supabase
        .from('profiles')
        .insert(input)
        .overrideTypes<Profile>()

      if (error) {
        console.log("insert error", error)
        throw new Error(error.message)
      }
    }),

  update: protectedProcedure
    .input(vProfile.update())
    .mutation(async options => {
      const { input, ctx } = options
      const { id } = input

      const updated_at = new Date().toISOString()
      const updatedProfile = { ...input, updated_at }

      const { data, error } = await ctx.supabase
        .from('profiles')
        .update(updatedProfile)
        .eq('id', id)
        .is('deleted_at', null)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    }),

  delete: protectedProcedure
    .input(vProfile.delete())
    .mutation(async options => {
      const { input, ctx } = options
      const { id } = input

      const { error } = await ctx.supabase
        .from('profiles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (error) {
        throw new Error(error.message)
      }
    }),

  updateContact: publicProcedure
    .input(vProfile.updateContact())
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Debes iniciar sesión' });
      }

      const { error } = await ctx.supabase
        .from('profiles')
        .upsert(
          {
            id: ctx.user.id,
            email: input.email,
            full_name: input.full_name,
            phone: input.phone ?? '',
            avatar_url: '',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
    }),
})
