# Backend tRPC: cómo funciona hoy y cómo hacerlo serverless

Este documento describe el backend de esta tienda: qué es, qué no es, por qué **hoy (en local) no es serverless**, y cómo **sí se puede** ejecutar en serverless sin reescribir el router.

Si la pregunta es “¿lo subo a Vercel y ya es serverless?”: **sí, automático.** Ver [vercel-serverless.md](./vercel-serverless.md).

---

## Resumen

| Pregunta | Respuesta |
|----------|-----------|
| ¿Hay un servidor Express/Nest aparte? | No |
| ¿Qué es el “backend”? | Next.js (tRPC) + Postgres/Auth/Storage en Supabase |
| ¿tRPC es un proceso 24/7 propio? | No. Es un router HTTP montado en Next |
| ¿Es serverless ahora? | **No** (se corre con `next dev` / `next start`) |
| ¿El código ya sirve para serverless? | **Sí** (adaptador Fetch, sin estado en memoria) |
| ¿Hay que reescribir procedures para Vercel? | No. Cambia el host, no el `appRouter` |

En una frase: **BFF tRPC dentro de Next.js + Postgres en Supabase**. Serverless o no lo decide **dónde despliegas Next**, no tRPC.

**BFF** (*Backend for Frontend*): la API está hecha para esta UI, no es un backend de dominio genérico para móviles, partners, etc. El navegador llama procedures (`trpc.orders.setShipping`) que ya conocen sesión, Zod y qué RPC SQL ejecutar.

---

## Cómo funciona ahora

```
Navegador / RSC
      │
      ├─ Cliente tRPC  ──httpBatchLink──►  GET|POST /api/trpc
      │                                         │
      │                                         ▼
      │                              fetchRequestHandler
      │                                         │
      │                         createContext (cookie + user)
      │                                         │
      │                                    appRouter
      │                              (orders, cart, …)
      │                                         │
      └─ Caller RSC (sin HTTP) ─────────────────┤
                                                ▼
                                    Supabase (HTTP)
                                         │
                         ┌───────────────┼───────────────┐
                         ▼               ▼               ▼
                      Tablas+RLS    RPCs SQL         Storage
                      Auth          (pedidos,        (imágenes,
                                    stock, …)         comprobantes)

Cron HTTP  /api/cron/*  ──x-api-key──►  service_role  ──►  RPC / APIs
Emails     Resend (desde procedures o crons, en el servidor Next)
```

No hay microservicios. No hay Edge Functions de Deno. No hay cola propia.

### 1. Capa API: tRPC en Next.js

**Entrada HTTP** — `src/app/api/trpc/[trpc]/route.ts`

- Adaptador `@trpc/server/adapters/fetch` (`Request` / `Response`).
- Exporta `GET` y `POST`. No hay `server.listen()`.
- Endpoint: `/api/trpc`.
- Runtime por defecto: **Node** (no hay `export const runtime = "edge"`).

**Router** — `src/trpc/trpc.router.ts`

Dominios: `profiles`, `categories`, `brands`, `payment_methods`, `addresses`, `products`, `cart`, `productVariants`, `productOptionTypes`, `productOptionValues`, `orders`, `storeSettings`, `exchange_rates`, `stats`, `contact`, `reviews`.

**Contexto** — `src/trpc/trpc.context.ts`

Por cada request: cliente Supabase (cookie) + `user` (o `null`) + flag `is_dev`.

**Procedures** — `src/trpc/index.ts`

| Procedure | Quién entra |
|-----------|-------------|
| `publicProcedure` | Cualquiera. Inyecta `ctx.supabase` (anon + cookie). Guest usa token o `service_role` donde hace falta. |
| `protectedProcedure` | Sesión obligatoria (`auth.getUser()`). Si no hay user → `UNAUTHORIZED`. |

Validación de input: Zod en `src/validations/`.

**Cliente browser** — `src/providers/TRPCProdiver.tsx`

```ts
httpBatchLink({ url: `/api/trpc` })
```

Misma origen que la tienda. Varias procedures en un solo HTTP (batch).

**Cliente servidor (RSC)** — `src/config/trpc.server.config.ts`

`createCallerFactory(appRouter)`: las Server Components pueden llamar al router **en proceso**, sin round-trip HTTP.

### 2. Capa datos: Supabase (siempre viva)

Supabase **sí** es un servicio persistente (Postgres, Auth, Storage). Eso no se “vuelve serverless”.

Dos clientes en servidor:

| Helper | Key | Uso |
|--------|-----|-----|
| `createServerClient()` (`src/utils/supabase/supabase.server.ts`) | `anon` + cookies | Usuario autenticado, RLS |
| `createServiceClient()` (`src/utils/supabase/supabase.service.ts`) | `service_role` | Bypass RLS: guest, admin, crons. **Nunca en el browser** |

Hablar con la DB es **HTTP al API de Supabase**, no un pool `pg` dentro de Node. Eso importa para serverless (no explotas conexiones Postgres por instancia).

Lógica transaccional (stock, crear pedido, pago, reembolso, envío) vive en **funciones PL/pgSQL**, no en Lambdas:

- `create_order_from_cart`, `create_guest_order`
- `set_order_shipping`, `submit_order_payment`
- `confirm_order_payment`, `cancel_order`, `refund_order`
- `expire_pending_orders`, `recalculate_product_review_stats`

Están en `supabase/functions/standalone/` (SQL). El router tRPC hace `.rpc('…')`.

CRUD simple (catálogo, direcciones, settings) suele ser `.from('tabla')` desde tRPC.

### 3. Fuera de tRPC

| Ruta | Rol |
|------|-----|
| `src/app/api/cron/expire-orders/route.ts` | Expira pedidos pendientes (`expire_pending_orders`) + email admin |
| `src/app/api/cron/ves-rates/route.ts` | Actualiza tasas VES |

Ambas: `GET` + header `x-api-key` = `CRON_API_KEY`. Usan `createServiceClient()`.

Correo: Resend desde `src/lib/email/` (pedido creado, pago, envío, cancelación, reembolso, contacto). Se dispara en el proceso Next, no en un worker aparte.

### 4. Cómo se corre hoy (por eso no es serverless)

```bash
pnpm run dev    # next dev  → proceso Node largo
pnpm run start  # next start → proceso Node largo (tras next build)
```

No hay `vercel.json`, Dockerfile ni `runtime = "edge"`. Mientras el proceso vive, atiende todos los `/api/trpc`. Eso es un **servidor convencional**, aunque el *código* de cada procedure sea “un request → un JSON”.

---

## ¿tRPC puede ser serverless?

Sí. tRPC no es un daemon. Es **router + adaptador**. Si el adaptador habla Fetch, una plataforma de funciones puede ejecutar: request → `createContext` → procedure → respuesta → fin.

Lo que **no** encaja en serverless puro:

- Adapter WebSocket (`ws`) para subscriptions
- `createHTTPServer` de Node (proceso largo)
- Estado global en RAM entre requests
- Jobs de minutos (timeout del host)

Esta app: mutations/queries, sin subscriptions tRPC, sin estado en RAM. Compatible.

---

## Por qué convertirlo (y por qué no)

### Por qué sí

- **Cero idle:** no pagas un VPS 24/7 si el tráfico es bajo o irregular.
- **Escala por request:** picos de catálogo/checkout sin redimensionar a mano.
- **Mismo código:** el `appRouter` no cambia; Next en Vercel (u similar) ya parte `/api/trpc` en funciones.
- **Supabase no se toca:** Auth, RLS y RPCs siguen igual. Solo cambia el proceso que llama `.rpc()`.
- El handler actual **ya es el contrato serverless** (`GET`/`POST` + Fetch).

### Por qué no (o no todavía)

- **Cold start:** la primera llamada tras inactividad tarda más.
- **Timeouts:** Hobby ~10s; un RPC raro + email síncrono puede cortarse.
- **Emails al final de la procedure:** si la función termina antes de que Resend responda, se pierde el correo. En un Node largo duele menos. En serverless a veces hace falta `waitUntil` o cola.
- **Crons:** hay que agendarlos en el host (Vercel Cron, etc.); no “van solos” por existir la ruta.
- **Debug:** un proceso local es más simple que logs por invocación.
- Si ya tienes un VPS barato y tráfico estable, **no ganas nada obligatorio** con serverless.

Serverless no hace el backend “más tRPC”. Solo cambia el ciclo de vida del proceso Next.

---

## Cómo convertirlo (esta app)

No hace falta un segundo servicio tRPC. El camino natural es **desplegar el Next actual en un host de funciones**.

### Opción A — Next en Vercel (la de menos fricción)

1. Proyecto en Vercel apuntando al repo.
2. Variables de entorno (mismas que `.env.local` de servidor):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - Resend y URLs de la tienda
   - `CRON_API_KEY`
   - `EXCHANGE_RATES_API_KEY` (cron de tasas)
3. Build: `next build`. Vercel trata `src/app/api/trpc/[trpc]/route.ts` como función Node.
4. El cliente sigue en `httpBatchLink({ url: "/api/trpc" })` (mismo dominio).
5. Crons: `vercel.json` con schedule hacia `/api/cron/expire-orders` y `/api/cron/ves-rates`, enviando `x-api-key`.
6. **No** pongas `export const runtime = "edge"` en `/api/trpc` sin probar: `@supabase/ssr`, `cookies()`, Resend y el service client asumen Node.

Local no cambia: `pnpm dev` sigue siendo un proceso largo. Serverless es el **deploy**.

### Opción B — API tRPC serverless separada

Solo si un día el frontend no es este Next (otra web, app nativa):

1. Extraer `appRouter` + `createContext` a un paquete o repo.
2. Handler Fetch en Lambda / Workers / función Vercel.
3. Cliente: `httpBatchLink({ url: "https://api.tutienda.com/trpc" })`.
4. CORS + cookies (o Bearer) entre orígenes.

Hoy es trabajo extra innecesario: UI y API ya viven juntos.

### Opción C — Lambda u otro cloud

`@trpc/server/adapters/aws-lambda` (u otro wrapper Fetch). El router se reutiliza. Hay que adaptar cookies de Supabase (en Next las da `next/headers`; en Lambda crudo no). Por eso, para **esta** app, A es más simple que C.

### Qué no reescribes

- `src/trpc/routes/*`
- `appRouter`
- Validaciones Zod
- RPCs SQL
- El cliente `trpc.*` en React

### Qué sí cuidas al pasar a funciones

1. **Sin estado en memoria** entre invocaciones (ya casi: sesión en cookie/JWT).
2. **Timeouts** de procedures + email. Preferir RPCs cortos; el correo no debería bloquear el límite del plan.
3. **Cold start** aceptable en admin y checkout.
4. **Crons** configurados en el host, no solo el archivo en el repo.
5. **Logs** por request en el dashboard del host.
6. Seguir en **runtime Node**, no Edge, salvo auditoría explícita.

---

## Mapa de archivos

```
src/app/api/trpc/[trpc]/route.ts   ← puente HTTP (esto se vuelve “la función”)
src/trpc/trpc.router.ts            ← appRouter
src/trpc/trpc.context.ts           ← ctx por request
src/trpc/index.ts                  ← public / protected
src/trpc/routes/*.ts               ← procedures
src/validations/                   ← Zod
src/config/trpc.config.ts          ← createTRPCReact
src/config/trpc.server.config.ts   ← caller RSC
src/providers/TRPCProdiver.tsx     ← httpBatchLink /api/trpc
src/utils/supabase/supabase.server.ts
src/utils/supabase/supabase.service.ts
src/app/api/cron/expire-orders/
src/app/api/cron/ves-rates/
src/lib/email/                     ← Resend
supabase/functions/standalone/     ← RPCs SQL (no son Edge Functions)
```

---

## Frases para no mezclar conceptos

- **tRPC** = contrato type-safe entre UI y servidor. No implica serverless ni un VPS.
- **Serverless** = el host crea/destruye el proceso por request (o por ráfaga).
- **Supabase** = backend-as-a-service siempre encendido (DB/Auth/Storage). Las “functions” de este repo son **SQL en Postgres**, no funciones serverless de Deno.
- **Hoy:** Next de proceso largo + Supabase. **Mañana, si despliegas en Vercel:** Next en funciones + el mismo Supabase.
