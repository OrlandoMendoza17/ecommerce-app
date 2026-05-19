import { router } from "@/trpc";
import { profileRouter } from "@/trpc/routes/profiles.router";
import { categoryRouter } from "@/trpc/routes/categories.router";
import { paymentMethodRouter } from "@/trpc/routes/payment_methods.router";

export const appRouter = router({
  profiles: profileRouter,
  categories: categoryRouter,
  payment_methods: paymentMethodRouter,
});

export type AppRouter = typeof appRouter;
