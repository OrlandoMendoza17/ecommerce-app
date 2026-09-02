/**
 * Limpieza secuencial de datos de prueba desde CUTOFF.
 *
 * Orden (evita conflictos de FK):
 * 1. Comprobantes en storage
 * 2. order_items
 * 3. orders
 * 4. product_stats (recalcula ventas/ingresos)
 * 5. auth.users (CASCADE → profiles, addresses, cart, reviews)
 *
 * Uso: npx tsx borrar.ts
 */
import path from "node:path";
import { config } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

config({ path: path.join(process.cwd(), ".env.local") });

const ORDER_PAYMENT_PROOFS_BUCKET = "order_payment_proofs";
const CUTOFF = "2026-08-20 00:00:00-04";
const BATCH_SIZE = 100;

type OrderRow = { id: string; profile_id: string | null };
type ProfileRow = { id: string };

function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL no está definida en .env.local");
  }

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY no está definida en .env.local");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function chunk<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

function getOrderProofFolder(order: OrderRow) {
  return order.profile_id
    ? `${order.profile_id}/${order.id}`
    : `guest/${order.id}`;
}

async function fetchAllProfilesToDelete(
  supabase: SupabaseClient,
): Promise<ProfileRow[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .gte("created_at", CUTOFF)
    .eq("is_admin", false);

  if (error) {
    throw new Error(`Error al consultar perfiles: ${error.message}`);
  }

  return data ?? [];
}

async function fetchAllOrdersToDelete(
  supabase: SupabaseClient,
  profileIds: string[],
): Promise<OrderRow[]> {
  const byCutoff = await supabase
    .from("orders")
    .select("id, profile_id")
    .gte("created_at", CUTOFF);

  if (byCutoff.error) {
    throw new Error(`Error al consultar órdenes: ${byCutoff.error.message}`);
  }

  const byProfile: OrderRow[] = [];

  for (const ids of chunk(profileIds, BATCH_SIZE)) {
    if (!ids.length) continue;

    const { data, error } = await supabase
      .from("orders")
      .select("id, profile_id")
      .in("profile_id", ids);

    if (error) {
      throw new Error(
        `Error al consultar órdenes por perfil: ${error.message}`,
      );
    }

    byProfile.push(...(data ?? []));
  }

  const byId = new Map<string, OrderRow>();
  for (const order of [...(byCutoff.data ?? []), ...byProfile]) {
    byId.set(order.id, order);
  }

  return [...byId.values()];
}

async function step1DeleteStorageProofs(
  supabase: SupabaseClient,
  orders: OrderRow[],
) {
  console.log("\n[1/5] Borrando comprobantes de pago en storage...");

  const paths: string[] = [];

  for (const order of orders) {
    const folder = getOrderProofFolder(order);

    const { data: files, error } = await supabase.storage
      .from(ORDER_PAYMENT_PROOFS_BUCKET)
      .list(folder);

    if (error) {
      // Carpeta inexistente = no hay archivos; seguimos
      continue;
    }

    if (files?.length) {
      paths.push(...files.map((file) => `${folder}/${file.name}`));
    }
  }

  if (!paths.length) {
    console.log("  No hay comprobantes.");
    return;
  }

  for (const batch of chunk(paths, BATCH_SIZE)) {
    const { error } = await supabase.storage
      .from(ORDER_PAYMENT_PROOFS_BUCKET)
      .remove(batch);

    if (error) {
      throw new Error(`Error al borrar storage: ${error.message}`);
    }

    console.log(`  Borrados ${batch.length} archivo(s)`);
  }

  console.log(`  Total: ${paths.length} comprobante(s).`);
}

async function step2DeleteOrderItems(
  supabase: SupabaseClient,
  orderIds: string[],
) {
  console.log("\n[2/5] Borrando order_items...");

  if (!orderIds.length) {
    console.log("  Nada que borrar.");
    return;
  }

  let deleted = 0;

  for (const ids of chunk(orderIds, BATCH_SIZE)) {
    const { data, error } = await supabase
      .from("order_items")
      .delete()
      .in("order_id", ids)
      .select("id");

    if (error) {
      throw new Error(`Error al borrar order_items: ${error.message}`);
    }

    deleted += data?.length ?? 0;
  }

  console.log(`  Borrados ${deleted} item(s).`);
}

async function step3DeleteOrders(supabase: SupabaseClient, orderIds: string[]) {
  console.log("\n[3/5] Borrando orders...");

  if (!orderIds.length) {
    console.log("  Nada que borrar.");
    return;
  }

  let deleted = 0;

  for (const ids of chunk(orderIds, BATCH_SIZE)) {
    const { data, error } = await supabase
      .from("orders")
      .delete()
      .in("id", ids)
      .select("id");

    if (error) {
      throw new Error(`Error al borrar orders: ${error.message}`);
    }

    deleted += data?.length ?? 0;
  }

  console.log(`  Borradas ${deleted} orden(es).`);
}

async function step4RecalcProductStats(
  supabase: SupabaseClient,
  productIds: string[],
) {
  console.log("\n[4/5] Recalculando product_stats...");

  const uniqueProductIds = [...new Set(productIds)];

  if (!uniqueProductIds.length) {
    console.log("  Nada que recalcular.");
    return;
  }

  // Órdenes confirmadas que quedan (para recalcular ventas reales)
  const { data: confirmedOrders, error: confirmedError } = await supabase
    .from("orders")
    .select("id")
    .in("status", ["payment_confirmed", "shipped", "delivered"]);

  if (confirmedError) {
    throw new Error(
      `Error al consultar órdenes confirmadas: ${confirmedError.message}`,
    );
  }

  const confirmedOrderIds = new Set(
    (confirmedOrders ?? []).map((order) => order.id),
  );

  for (const productId of uniqueProductIds) {
    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("order_id, quantity, subtotal")
      .eq("product_id", productId);

    if (itemsError) {
      throw new Error(
        `Error al recalcular stats de ${productId}: ${itemsError.message}`,
      );
    }

    const confirmedItems =
      items?.filter((item) => confirmedOrderIds.has(item.order_id)) ?? [];

    const totalSales = confirmedItems.reduce(
      (sum, item) => sum + (item.quantity ?? 0),
      0,
    );
    const totalRevenue = confirmedItems.reduce(
      (sum, item) => sum + Number(item.subtotal ?? 0),
      0,
    );

    const { data: existing, error: existingError } = await supabase
      .from("product_stats")
      .select("product_id, total_reviews")
      .eq("product_id", productId)
      .maybeSingle();

    if (existingError) {
      throw new Error(
        `Error al leer product_stats de ${productId}: ${existingError.message}`,
      );
    }

    if (!existing) {
      continue;
    }

    if (totalSales === 0 && totalRevenue === 0 && existing.total_reviews === 0) {
      const { error: deleteError } = await supabase
        .from("product_stats")
        .delete()
        .eq("product_id", productId);

      if (deleteError) {
        throw new Error(
          `Error al borrar product_stats de ${productId}: ${deleteError.message}`,
        );
      }

      console.log(`  Eliminado stats vacío: ${productId}`);
      continue;
    }

    const { error: updateError } = await supabase
      .from("product_stats")
      .update({
        total_sales: totalSales,
        total_revenue: totalRevenue,
        updated_at: new Date().toISOString(),
      })
      .eq("product_id", productId);

    if (updateError) {
      throw new Error(
        `Error al actualizar product_stats de ${productId}: ${updateError.message}`,
      );
    }

    console.log(
      `  Actualizado ${productId}: sales=${totalSales}, revenue=${totalRevenue}`,
    );
  }
}

async function step5DeleteAuthUsers(
  supabase: SupabaseClient,
  profileIds: string[],
) {
  console.log("\n[5/5] Borrando auth.users (+ profiles por CASCADE)...");

  if (!profileIds.length) {
    console.log("  Nada que borrar.");
    return;
  }

  let deleted = 0;

  for (const userId of profileIds) {
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      throw new Error(`Error al borrar usuario ${userId}: ${error.message}`);
    }

    deleted += 1;
    console.log(`  Borrado usuario ${userId}`);
  }

  console.log(`  Total: ${deleted} usuario(s).`);
}

async function main() {
  const supabase = createServiceClient();

  console.log(`Corte: ${CUTOFF}`);
  console.log("Recolectando datos...");

  const profiles = await fetchAllProfilesToDelete(supabase);
  const profileIds = profiles.map((p) => p.id);

  const orders = await fetchAllOrdersToDelete(supabase, profileIds);
  const orderIds = orders.map((o) => o.id);

  // Productos afectados (antes de borrar items)
  const productIds: string[] = [];

  for (const ids of chunk(orderIds, BATCH_SIZE)) {
    if (!ids.length) continue;

    const { data, error } = await supabase
      .from("order_items")
      .select("product_id")
      .in("order_id", ids);

    if (error) {
      throw new Error(
        `Error al consultar productos afectados: ${error.message}`,
      );
    }

    productIds.push(...(data?.map((row) => row.product_id) ?? []));
  }

  console.log(`  Perfiles a borrar: ${profileIds.length}`);
  console.log(`  Órdenes a borrar:  ${orderIds.length}`);
  console.log(`  Productos a recalcular: ${new Set(productIds).size}`);

  if (!orderIds.length && !profileIds.length) {
    console.log("\nNada que limpiar.");
    return;
  }

  await step1DeleteStorageProofs(supabase, orders);
  await step2DeleteOrderItems(supabase, orderIds);
  await step3DeleteOrders(supabase, orderIds);
  await step4RecalcProductStats(supabase, productIds);
  await step5DeleteAuthUsers(supabase, profileIds);

  console.log("\nListo. Limpieza completada.");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\nError: ${message}`);
  process.exit(1);
});
