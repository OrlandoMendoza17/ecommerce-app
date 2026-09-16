# Vercel: este proyecto ya es serverless al desplegarlo

No hay que “convertir” el backend. **Si montas este repo en Vercel tal cual está, tRPC y las rutas** `/api/`* **corren serverless solos.** No hay un switch en el código ni un segundo servicio que crear.

Documento complementario: [backend-trpc-serverless.md](./backend-trpc-serverless.md) (cómo está armado tRPC + Supabase). Este archivo responde solo: *¿en Vercel se vuelve serverless automáticamente? ¿Por qué?*

---

## La respuesta corta

**Sí.** Subes el Next.js actual a Vercel → el host empaqueta `src/app/api/trpc/[trpc]/route.ts` (y el resto de Route Handlers) como **funciones**. Cada llamada a `/api/trpc` es una invocación. Tú no dejas un `next start` 24/7.

En tu laptop eso **no** ocurre: `pnpm dev` es un Node que se queda abierto. Serverless empieza **en el deploy de Vercel**, no al escribir tRPC.

---



## Qué es serverless aquí (sin jerga)

Un servidor clásico:

1. Enciendes la máquina / el proceso.
2. Se queda escuchando.
3. Llegan 0 o 10.000 requests: el proceso sigue vivo.
4. Apagas tú.

Serverless en Vercel:

1. Llega un HTTP a `/api/trpc`.
2. Vercel ejecuta tu handler (`GET`/`POST`).
3. Corre `createContext` + la procedure (`orders.setShipping`, etc.).
4. Devuelve JSON.
5. Esa ejecución termina. No hay un proceso tuyo esperando la siguiente.

No significa “sin servidor en el universo”. Significa **tú no administras un proceso Node permanente**. Vercel presta compute cuando hay tráfico.

---



## Por qué es automático (no hay que reescribir nada)

Vercel está hecho para Next.js. Al hacer `next build` mira el App Router:


| Archivo en el repo                        | Qué publica Vercel                                                  |
| ----------------------------------------- | ------------------------------------------------------------------- |
| `src/app/api/trpc/[trpc]/route.ts`        | Función serverless Node en `/api/trpc`                              |
| `src/app/api/cron/expire-orders/route.ts` | Función en `/api/cron/expire-orders`                                |
| `src/app/api/cron/ves-rates/route.ts`     | Función en `/api/cron/ves-rates`                                    |
| Páginas `src/app/**/page.tsx`             | UI; el servidor de esas páginas también corre en su infraestructura |


Este proyecto **ya usa la forma que Vercel espera**: un Route Handler con `GET`/`POST`. Vercel no necesita que lo envuelvas en Lambda a mano, ni `vercel.json` para “activar serverless”, ni `export const runtime = "edge"`.

### Handler — lo que Vercel convierte en función

`src/app/api/trpc/[trpc]/route.ts`. Un `Request` entra, tRPC responde, se acaba. Esos `export` son el contrato de Next/Vercel:

```ts
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/trpc/trpc.router";
import { createContext } from "@/trpc/trpc.context";

const handler = (req: Request) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
    req,
  });
};

export { handler as GET, handler as POST };
```



### `appRouter` — el árbol de procedures

`src/trpc/trpc.router.ts`. Esto **no** es el servidor: es el mapa. El handler de arriba lo pasa entero a cada invocación:

```ts
export const appRouter = router({
  profiles: profileRouter,
  products: productRouter,
  cart: cartRouter,
  orders: ordersRouter,
  contact: contactRouter,
  reviews: reviewsRouter,
  // …categories, brands, addresses, etc.
});

export type AppRouter = typeof appRouter;
```

Una llamada del cliente `trpc.contact.send.mutate(…)` en Vercel es `POST /api/trpc/contact.send` → este árbol → `contactRouter.send`.

### Un router — una procedure

`src/trpc/routes/contact.router.ts` (el resto de routers es el mismo patrón: `publicProcedure` o `protectedProcedure` + Zod + Supabase/email):

```ts
export const contactRouter = router({
  send: publicProcedure.input(contactSendSchema).mutation(async ({ input }) => {
    const toAdmin = await getSupportEmail();
    await notifyContactMessage({ toAdmin, ...input });
    return { success: true };
  }),
});
```

En Vercel esa mutation corre **dentro de la misma función** del handler. No hay un proceso `contact` aparte.

El cliente ya pega a esa ruta, mismo dominio:

```ts
httpBatchLink({ url: `/api/trpc` })
```

En producción será `https://tu-dominio.vercel.app/api/trpc`. El `appRouter`, Zod y las RPCs de Supabase no cambian.

**No es automático porque tRPC sea mágico.** Es automático porque:

1. tRPC está **montado como Route Handler Fetch** (un request entra, un response sale).
2. Vercel **trata esos Route Handlers como funciones** por convención de Next.
3. El código **no guarda estado en RAM** entre requests (sesión en cookie/Supabase).

Si el backend fuera un `server.listen(3001)` aparte, Vercel no lo volvería serverless solo. Este no lo es.

---



## Local vs Vercel (mismo código)

```
Mismo repo, mismo appRouter
        │
        ├─ pnpm dev / next start     →  un proceso Node largo
        │                              (no serverless)
        │
        └─ Deploy en Vercel          →  el mismo handler, por invocación
                                       (sí serverless)
```

Por eso antes se decía “el código es compatible” y “hoy no es serverless”: **el archivo no cambia; cambia quién ejecuta el proceso.**

No hay una rama “versión serverless” del router.

---



## Qué se vuelve serverless y qué no


| Pieza                               | ¿Serverless en Vercel?                                            |
| ----------------------------------- | ----------------------------------------------------------------- |
| `/api/trpc` (todo el backend tRPC)  | Sí, automático                                                    |
| `/api/cron/*`                       | Sí como función HTTP; **el horario no** (hay que configurar Cron) |
| Páginas Next (RSC, checkout, admin) | También en la infra de Vercel (no es un VPS tuyo)                 |
| Postgres, Auth, Storage (Supabase)  | **No.** Siguen siendo un servicio 24/7                            |
| Resend                              | Servicio externo; lo llamas desde la función                      |


Serverless es la **capa Next/tRPC**. La base de datos no “se apaga” entre pedidos.

---



## Qué sí tienes que hacer en Vercel (no es código)

Esto no es “activar serverless”. Es operar el deploy:

1. **Variables de entorno** en el dashboard (las mismas de `.env.local` de servidor): Supabase, `SUPABASE_SERVICE_ROLE_KEY`, Resend, `CRON_API_KEY`, etc.
2. **Crons:** las rutas existen, pero nadie las llama solas. En Vercel Cron (o `vercel.json`) programas `GET /api/cron/expire-orders` y `GET /api/cron/ves-rates` con el header `x-api-key`.
3. **Límites del plan:** en Hobby una función dura poco (~10s). Un checkout + RPC a Supabase suele caber. Un job enorme no.

Sin esos tres, el sitio puede abrir y tRPC puede responder, pero emails/crons/keys fallan. Eso pasa igual en un VPS si no configuras env.

---



## Qué no hagas “para volverlo serverless”

- No extraigas tRPC a otro repo.
- No pongas `runtime = "edge"` en `/api/trpc` salvo que sepas que cookies de Supabase, Resend y el `service_role` van en Edge (hoy asumen **Node**).
- No reescribas procedures ni RPCs SQL.
- No cambies el `httpBatchLink` a otra URL: en Vercel el frontend y `/api/trpc` salen del **mismo proyecto**.

---



## Cómo se ve una petición real en Vercel

1. El browser llama `POST /api/trpc/orders.setShipping` (o un batch).
2. Vercel enruta a la función del Route Handler.
3. `createContext` lee cookies → usuario o guest.
4. Corre la procedure → `.rpc('set_order_shipping')` hacia Supabase.
5. JSON de vuelta al cliente.
6. Fin de la invocación.

Si no hay tráfico un rato, la siguiente llamada puede tardar un poco más (**cold start**). Es el precio de no tener el proceso siempre caliente. No indica que falte configuración serverless.

---



## Una frase para quedártelo

**Este backend no “se convierte” a serverless: en Vercel ya se ejecuta así, porque es Next App Router y tRPC vive en un Route Handler.** En local es un servidor largo; en Vercel, funciones. El código es el mismo.