import { router, publicProcedure, protectedProcedure } from "@/trpc";
import { vProduct } from '@/validations/products.validations'
import { applyCustomFilters } from '@/utils/supabase/filters'
import { applyBulkTarget } from '@/utils/supabase/bulk'
import { attachDefaultVariantsToProducts } from '@/utils/products/attachDefaultVariants'
import {
  countStoreCatalogProducts,
  listStoreCatalogProducts,
} from '@/utils/products/storeCatalog'

const productFilters = ['category_id', 'brand_id', 'is_active', 'is_featured', 'is_digital', 'created_at'] as const

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
          `name.ilike.%${q}%,slug.ilike.%${q}%,description.ilike.%${q}%`
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
          `name.ilike.%${q}%,slug.ilike.%${q}%,description.ilike.%${q}%`
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
    const { search, category_id, brand_id, is_active, is_featured, condition, tags } = input

    let query = ctx.supabase
      .from('products')
      .select('*')

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,slug.ilike.%${search}%,description.ilike.%${search}%`
      )
    }

    if (category_id !== undefined) {
      if (category_id === null) {
        query = query.is('category_id', null)
      } else {
        query = query.eq('category_id', category_id)
      }
    }

    if (brand_id !== undefined) {
      if (brand_id === null) {
        query = query.is('brand_id', null)
      } else {
        query = query.eq('brand_id', brand_id)
      }
    }

    if (is_active !== undefined) query = query.eq('is_active', is_active)
    if (is_featured !== undefined) query = query.eq('is_featured', is_featured)
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

  getStats: publicProcedure
    .input(vProduct.getById())
    .query(async ({ input, ctx }): Promise<{ total_reviews: number; average_rating: number }> => {
      const { data } = await ctx.supabase
        .from('product_stats')
        .select('total_reviews, average_rating')
        .eq('product_id', input.id)
        .maybeSingle()

      return {
        total_reviews: data?.total_reviews ?? 0,
        average_rating: Number(data?.average_rating ?? 0),
      }
    }),

  insert: protectedProcedure
    .input(vProduct.insert())
    .mutation(async (options) => {
      const { input, ctx } = options
      if (!ctx.user) throw new Error('User not authenticated')

      const { data, error } = await ctx.supabase
        .from('products')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      const { data, error } = await ctx.supabase
        .from('products')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      let query = ctx.supabase.from('products').delete()
      query = applyBulkTarget(query, input, {
        allowedFilters: productFilters,
        searchFields: ['name', 'slug', 'description'],
      })

      const { error } = await query
      if (error) throw new Error(error.message)
    }),

  bulkUpdate: protectedProcedure
    .input(vProduct.bulkUpdate())
    .mutation(async (options) => {
      const { input, ctx } = options
      const { data, ...target } = input

      const updated_at = new Date().toISOString()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = ctx.supabase.from('products').update({ ...data, updated_at } as any)
      query = applyBulkTarget(query, target, {
        allowedFilters: productFilters,
        searchFields: ['name', 'slug', 'description'],
      })

      const { error } = await query
      if (error) throw new Error(error.message)
    }),

  bulkAdjustPrice: protectedProcedure
    .input(vProduct.bulkAdjustPrice())
    .mutation(async (options) => {
      const { input, ctx } = options
      const { mode, amount, target, roundTo99, ...bulkTarget } = input

      let targetProductQuery = ctx.supabase
        .from('products')
        .select('id, price, compare_at_price')

      targetProductQuery = applyBulkTarget(targetProductQuery, bulkTarget, {
        allowedFilters: productFilters,
        searchFields: ['name', 'slug', 'description'],
      })

      const { data: targetProducts, error: prodErr } = await targetProductQuery
      if (prodErr) throw new Error(prodErr.message)
      if (!targetProducts || targetProducts.length === 0) return

      const productIds = targetProducts.map((p) => p.id)

      const { data: variants, error: varErr } = await ctx.supabase
        .from('product_variants')
        .select('id, product_id, price, compare_at_price, is_active')
        .in('product_id', productIds)

      if (varErr) throw new Error(varErr.message)

      const calculate = (curr: number): number => {
        let val = curr
        if (mode === 'percentage') {
          val = curr * (1 + amount / 100)
        } else {
          val = curr + amount
        }
        val = Math.max(0, val)
        if (roundTo99) {
          val = Math.floor(val) + 0.99
          if (val < 0.99) val = 0.99
        } else {
          val = Math.round(val * 100) / 100
        }
        return val
      }

      if (variants && variants.length > 0) {
        for (const variant of variants) {
          const updatePayload: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
          }

          if (target === 'price' || target === 'both') {
            updatePayload.price = calculate(variant.price ?? 0)
          }
          if (target === 'compare_at_price' || target === 'both') {
            updatePayload.compare_at_price = calculate(variant.compare_at_price ?? 0)
          }

          await ctx.supabase
            .from('product_variants')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .update(updatePayload as any)
            .eq('id', variant.id)
        }

        for (const pid of productIds) {
          const { data: activeVars } = await ctx.supabase
            .from('product_variants')
            .select('price, compare_at_price')
            .eq('product_id', pid)
            .eq('is_active', true)
            .order('price', { ascending: true })
            .limit(1)

          if (activeVars && activeVars.length > 0) {
            await ctx.supabase
              .from('products')
              .update({
                price: activeVars[0].price,
                compare_at_price: activeVars[0].compare_at_price,
                updated_at: new Date().toISOString(),
              })
              .eq('id', pid)
          }
        }
      } else {
        for (const prod of targetProducts) {
          const updatePayload: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
          }
          if (target === 'price' || target === 'both') {
            updatePayload.price = calculate(Number(prod.price ?? 0))
          }
          if (target === 'compare_at_price' || target === 'both') {
            updatePayload.compare_at_price = calculate(Number(prod.compare_at_price ?? 0))
          }
          await ctx.supabase
            .from('products')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .update(updatePayload as any)
            .eq('id', prod.id)
        }
      }
    }),

  duplicate: protectedProcedure
    .input(vProduct.duplicate())
    .mutation(async (options) => {
      const { input, ctx } = options

      const { data: original, error: origError } = await ctx.supabase
        .from('products')
        .select('*')
        .eq('id', input.id)
        .single()

      if (origError || !original) {
        throw new Error(origError?.message ?? 'Producto no encontrado')
      }

      let counter = 1
      let candidateSlug = `${original.slug}-copia`
      while (true) {
        const { data: existing } = await ctx.supabase
          .from('products')
          .select('id')
          .eq('slug', candidateSlug)
          .limit(1)

        if (!existing || existing.length === 0) break
        counter += 1
        candidateSlug = `${original.slug}-copia-${counter}`
      }

      const newProductPayload = {
        category_id: original.category_id,
        brand_id: original.brand_id,
        name: `${original.name} (Copia)`,
        slug: candidateSlug,
        description: original.description,
        price: original.price,
        compare_at_price: original.compare_at_price,
        condition: original.condition,
        is_digital: original.is_digital,
        tags: original.tags,
        attributes: original.attributes,
        images: original.images,
        meta_title: original.meta_title,
        meta_description: original.meta_description,
        is_active: false,
        is_featured: false,
      }

      const { data: newProduct, error: insertError } = await ctx.supabase
        .from('products')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert(newProductPayload as any)
        .select()
        .single()

      if (insertError || !newProduct) {
        throw new Error(insertError?.message ?? 'Error al duplicar el producto')
      }

      const { data: optionTypes } = await ctx.supabase
        .from('product_option_types')
        .select('*')
        .eq('product_id', original.id)

      const optionValueMap = new Map<string, string>()

      if (optionTypes && optionTypes.length > 0) {
        for (const ot of optionTypes) {
          const { data: newOt } = await ctx.supabase
            .from('product_option_types')
            .insert({
              product_id: newProduct.id,
              name: ot.name,
              display_order: ot.display_order,
            })
            .select()
            .single()

          if (newOt) {
            const { data: oldValues } = await ctx.supabase
              .from('product_option_values')
              .select('*')
              .eq('option_type_id', ot.id)

            if (oldValues && oldValues.length > 0) {
              for (const ov of oldValues) {
                const { data: newOv } = await ctx.supabase
                  .from('product_option_values')
                  .insert({
                    option_type_id: newOt.id,
                    value: ov.value,
                    display_order: ov.display_order,
                  })
                  .select()
                  .single()

                if (newOv) {
                  optionValueMap.set(ov.id, newOv.id)
                }
              }
            }
          }
        }
      }

      const { data: variants } = await ctx.supabase
        .from('product_variants')
        .select('*, variant_option_values(*)')
        .eq('product_id', original.id)

      if (variants && variants.length > 0) {
        for (const v of variants) {
          let newSku = ''
          if (v.sku && v.sku.trim() !== '') {
            let skuCounter = 1
            let candidateSku = `${v.sku}-COPIA`
            while (true) {
              const { data: existingSku } = await ctx.supabase
                .from('product_variants')
                .select('id')
                .eq('sku', candidateSku)
                .limit(1)

              if (!existingSku || existingSku.length === 0) break
              skuCounter += 1
              candidateSku = `${v.sku}-COPIA-${skuCounter}`
            }
            newSku = candidateSku
          }

          const { data: newVar, error: newVarErr } = await ctx.supabase
            .from('product_variants')
            .insert({
              product_id: newProduct.id,
              sku: newSku,
              price: v.price,
              compare_at_price: v.compare_at_price,
              cost: v.cost,
              stock_quantity: v.stock_quantity,
              low_stock_threshold: v.low_stock_threshold,
              allow_backorder: v.allow_backorder,
              images: v.images,
              is_active: v.is_active,
            })
            .select()
            .single()

          if (!newVarErr && newVar && v.variant_option_values) {
            const newLinks = []
            for (const vov of v.variant_option_values) {
              const newOptionValId = optionValueMap.get(vov.option_value_id)
              if (newOptionValId) {
                newLinks.push({
                  variant_id: newVar.id,
                  option_value_id: newOptionValId,
                })
              }
            }
            if (newLinks.length > 0) {
              await ctx.supabase.from('variant_option_values').insert(newLinks)
            }
          }
        }
      }

      return newProduct as unknown as Product
    }),

  exportCatalog: protectedProcedure
    .input(vProduct.exportCatalog())
    .query(async ({ input, ctx }) => {
      const { filters: customFilters, q, all } = input

      let query = ctx.supabase
        .from('products')
        .select(
          `
          *,
          category:categories(name),
          brand:brands(name),
          product_variants (
            sku,
            price,
            compare_at_price,
            stock_quantity,
            is_active
          )
        `
        )
        .order('created_at', { ascending: false })

      if (!all) {
        query = applyBulkTarget(
          query,
          { allMatching: true, filters: customFilters, q },
          {
            allowedFilters: productFilters,
            searchFields: ['name', 'slug', 'description'],
          }
        )
      }

      const { data, error } = await query
      if (error) throw new Error(error.message)
      return data ?? []
    }),

  bulkImport: protectedProcedure
    .input(vProduct.bulkImport())
    .mutation(async ({ input, ctx }) => {
      const { items, mode } = input
      let created = 0
      let updated = 0
      const errors: { row: number; name: string; error: string }[] = []

      const { data: dbCategories } = await ctx.supabase
        .from('categories')
        .select('id, name')
      const { data: dbBrands } = await ctx.supabase
        .from('brands')
        .select('id, name')

      const categoryMap = new Map<string, string>()
      dbCategories?.forEach((c) =>
        categoryMap.set(c.name.toLowerCase().trim(), c.id)
      )

      const brandMap = new Map<string, string>()
      dbBrands?.forEach((b) => brandMap.set(b.name.toLowerCase().trim(), b.id))

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const rowNum = i + 1

        try {
          const sku = item.sku?.trim()
          let matchedProductId: string | null = null
          let matchedVariantId: string | null = null

          if (sku) {
            const { data: vData } = await ctx.supabase
              .from('product_variants')
              .select('id, product_id')
              .eq('sku', sku)
              .limit(1)

            if (vData && vData.length > 0) {
              matchedVariantId = vData[0].id
              matchedProductId = vData[0].product_id
            }
          }

          if (!matchedProductId) {
            const candidateSlug =
              item.slug?.trim() ||
              item.name
                .normalize('NFD')
                .replace(/\p{M}/gu, '')
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')

            if (candidateSlug) {
              const { data: pData } = await ctx.supabase
                .from('products')
                .select('id')
                .eq('slug', candidateSlug)
                .limit(1)

              if (pData && pData.length > 0) {
                matchedProductId = pData[0].id
                const { data: firstVar } = await ctx.supabase
                  .from('product_variants')
                  .select('id')
                  .eq('product_id', matchedProductId)
                  .order('created_at', { ascending: true })
                  .limit(1)

                if (firstVar && firstVar.length > 0) {
                  matchedVariantId = firstVar[0].id
                }
              }
            }
          }

          const categoryId = item.category_name
            ? categoryMap.get(item.category_name.toLowerCase().trim()) ?? null
            : undefined

          const brandId = item.brand_name
            ? brandMap.get(item.brand_name.toLowerCase().trim()) ?? null
            : undefined

          if (matchedProductId) {
            if (mode === 'create_only') {
              continue
            }

            const now = new Date().toISOString()

            if (matchedVariantId) {
              await ctx.supabase
                .from('product_variants')
                .update({
                  price: item.price,
                  compare_at_price: item.compare_at_price ?? 0,
                  stock_quantity: item.stock_quantity ?? 0,
                  updated_at: now,
                })
                .eq('id', matchedVariantId)
            }

            if (mode === 'upsert') {
              const prodUpdates: Record<string, unknown> = {
                name: item.name.trim(),
                price: item.price,
                compare_at_price: item.compare_at_price ?? 0,
                updated_at: now,
              }
              if (item.description !== undefined)
                prodUpdates.description = item.description
              if (categoryId !== undefined) prodUpdates.category_id = categoryId
              if (brandId !== undefined) prodUpdates.brand_id = brandId
              if (item.condition) prodUpdates.condition = item.condition
              if (item.is_digital !== undefined)
                prodUpdates.is_digital = item.is_digital
              if (item.tags && item.tags.length > 0)
                prodUpdates.tags = item.tags
              if (item.images && item.images.length > 0)
                prodUpdates.images = item.images
              if (item.is_active !== undefined)
                prodUpdates.is_active = item.is_active
              if (item.is_featured !== undefined)
                prodUpdates.is_featured = item.is_featured

              await ctx.supabase
                .from('products')
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .update(prodUpdates as any)
                .eq('id', matchedProductId)
            }

            updated++
          } else {
            if (mode === 'stock_price_only') {
              continue
            }

            const slug =
              item.slug?.trim() ||
              item.name
                .normalize('NFD')
                .replace(/\p{M}/gu, '')
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')

            const newProductPayload = {
              name: item.name.trim(),
              slug: slug || `prod-${Date.now()}-${i}`,
              description: item.description ?? '',
              price: item.price,
              compare_at_price: item.compare_at_price ?? 0,
              category_id: categoryId ?? null,
              brand_id: brandId ?? null,
              condition: item.condition ?? 'new',
              is_digital: item.is_digital ?? false,
              tags: item.tags ?? [],
              images: item.images ?? [],
              is_active: item.is_active ?? true,
              is_featured: item.is_featured ?? false,
            }

            const { data: newProd, error: newProdErr } = await ctx.supabase
              .from('products')
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .insert(newProductPayload as any)
              .select()
              .single()

            if (newProdErr || !newProd) {
              throw new Error(newProdErr?.message ?? 'Error creando producto')
            }

            await ctx.supabase.from('product_variants').insert({
              product_id: newProd.id,
              sku: sku || '',
              price: item.price,
              compare_at_price: item.compare_at_price ?? 0,
              cost: 0,
              stock_quantity: item.stock_quantity ?? 0,
              low_stock_threshold: 5,
              allow_backorder: false,
              is_active: true,
              images: item.images ?? [],
            })

            created++
          }
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : 'Error inesperado'
          errors.push({
            row: rowNum,
            name: item.name,
            error: message,
          })
        }
      }

      return { created, updated, errors }
    }),

  storeCatalogCount: publicProcedure
    .input(vProduct.storeCatalogCount())
    .query(async ({ input, ctx }) => {
      return countStoreCatalogProducts(ctx.supabase, {
        q: input.q,
        category_id: input.category_id,
        brand_id: input.brand_id,
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
        brand_id: input.brand_id,
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
