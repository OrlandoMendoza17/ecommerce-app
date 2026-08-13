import { router } from "@/trpc";
import { profileRouter } from "@/trpc/routes/profiles.router";
import { categoryRouter } from "@/trpc/routes/categories.router";
import { brandRouter } from "@/trpc/routes/brands.router";
import { paymentMethodRouter } from "@/trpc/routes/payment_methods.router";
import { addressRouter } from "@/trpc/routes/addresses.router";
import { productRouter } from "@/trpc/routes/products.router";
import { cartRouter } from "@/trpc/routes/cart.router";
import { productVariantRouter } from "@/trpc/routes/product_variants.router";
import { productOptionTypeRouter } from "@/trpc/routes/product_option_types.router";
import { productOptionValueRouter } from "@/trpc/routes/product_option_values.router";
import { ordersRouter } from "@/trpc/routes/orders.router";
import { storeSettingsRouter } from "@/trpc/routes/store_settings.router";
import { exchangeRateRouter } from "@/trpc/routes/exchange_rates.router";
import { statsRouter } from "@/trpc/routes/stats.router";

export const appRouter = router({
  profiles: profileRouter,
  categories: categoryRouter,
  brands: brandRouter,
  payment_methods: paymentMethodRouter,
  addresses: addressRouter,
  products: productRouter,
  cart: cartRouter,
  productVariants: productVariantRouter,
  productOptionTypes: productOptionTypeRouter,
  productOptionValues: productOptionValueRouter,
  orders: ordersRouter,
  storeSettings: storeSettingsRouter,
  exchange_rates: exchangeRateRouter,
  stats: statsRouter,
});

export type AppRouter = typeof appRouter;
