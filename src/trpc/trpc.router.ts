import { router } from "@/trpc";
import { profileRouter } from "@/trpc/routes/profiles.router";
import { categoryRouter } from "@/trpc/routes/categories.router";
import { paymentMethodRouter } from "@/trpc/routes/payment_methods.router";
import { addressRouter } from "@/trpc/routes/addresses.router";
import { productRouter } from "@/trpc/routes/products.router";

export const appRouter = router({
  profiles: profileRouter,
  categories: categoryRouter,
  payment_methods: paymentMethodRouter,
  addresses: addressRouter,
  products: productRouter,
});

export type AppRouter = typeof appRouter;
