"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createClient } from "@/utils/supabase/supabase.client";
import { trpc } from "@/config/trpc.config";
import type {
  AddItemInput,
  CartContextValue,
  CartItem,
} from "./CartContext.types";
import type { ServerCartItem } from "@/trpc/routes/cart.router";
import { stockExceededMessage } from "@/lib/cart-stock";

const STORAGE_KEY = "guest-cart";

const CartContext = createContext<CartContextValue | null>(null);

function readGuestCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as CartItem[]).map((item) => ({
      ...item,
      stockQuantity: item.stockQuantity ?? 0,
      allowBackorder: item.allowBackorder ?? false,
    }));
  } catch {
    return [];
  }
}

function saveGuestCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function clearGuestCart() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

function buildOptionsLabel(options: { type_name: string; value: string }[]): string {
  return options.map((o) => `${o.type_name}: ${o.value}`).join(" / ");
}

function buildSelectedOptions(options: { type_name: string; value: string }[]): Record<string, string> {
  return Object.fromEntries(options.map((o) => [o.type_name, o.value]));
}

function serverItemsToCartItems(serverItems: ServerCartItem[]): CartItem[] {
  return serverItems
    .filter((item) => item.product !== null && item.variant !== null)
    .map((item) => {
      const options = item.variant?.options ?? [];
      const variantImages = item.variant?.images ?? [];
      const productImages = (item.product?.images as string[] | undefined) ?? [];

      return {
        id: item.id,
        productId: item.product!.id,
        variantId: item.variant!.id,
        name: item.product!.name,
        slug: item.product!.slug,
        image: variantImages[0] ?? productImages[0] ?? "",
        price: item.variant!.price,
        quantity: item.quantity,
        stockQuantity: item.variant!.stock_quantity,
        allowBackorder: item.variant!.allow_backorder ?? false,
        customization_text: item.customization_text,
        customization_notes: item.customization_notes,
        optionsLabel: buildOptionsLabel(options),
        selectedOptions: buildSelectedOptions(options),
      };
    });
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [guestItems, setGuestItems] = useState<CartItem[]>([]);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const hasMergedRef = useRef(false);

  // tRPC hooks — queries enabled only when authenticated
  const listQuery = trpc.cart.list.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const utils = trpc.useUtils();
  const invalidateCart = useCallback(() => {
    utils.cart.list.invalidate();
    utils.cart.summary.invalidate();
  }, [utils]);

  /** Espera a que el carrito en UI refleje los cambios del servidor */
  const refreshCart = useCallback(async () => {
    await Promise.all([
      utils.cart.list.refetch(),
      utils.cart.summary.refetch(),
    ]);
  }, [utils]);

  const addItemMutation = trpc.cart.addItem.useMutation({ onSuccess: invalidateCart });
  const updateItemMutation = trpc.cart.updateItem.useMutation();
  const removeItemMutation = trpc.cart.removeItem.useMutation();
  const clearMutation = trpc.cart.clear.useMutation({ onSuccess: invalidateCart });
  const mergeMutation = trpc.cart.mergeGuest.useMutation({ onSuccess: invalidateCart });

  // Subscribe to Supabase auth state
  useEffect(() => {
    const supabase = createClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const authed = !!session?.user;
        setIsAuthenticated(authed);

        if (authed && !hasMergedRef.current) {
          hasMergedRef.current = true;
          const local = readGuestCart();
          if (local.length > 0) {
            await mergeMutation.mutateAsync({
              items: local
                .filter((item) => !!item.variantId)
                .map((item) => ({
                  product_id: item.productId,
                  variant_id: item.variantId,
                  quantity: item.quantity,
                  customization_text: item.customization_text,
                  customization_notes: item.customization_notes,
                })),
            });
            clearGuestCart();
            setGuestItems([]);
          }
        }

        if (!authed) {
          hasMergedRef.current = false;
          setGuestItems(readGuestCart());
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load guest cart on mount
  useEffect(() => {
    setGuestItems(readGuestCart());
  }, []);

  const serverItems = useMemo(
    () => serverItemsToCartItems(listQuery.data ?? []),
    [listQuery.data]
  );

  const items = isAuthenticated ? serverItems : guestItems;

  const addItem = useCallback(
    async (input: AddItemInput, quantity = 1) => {
      const allowBackorder = input.allowBackorder ?? false;

      if (isAuthenticated) {
        try {
          await addItemMutation.mutateAsync({
            product_id: input.id,
            variant_id: input.variantId,
            quantity,
            customization_text: input.customization_text ?? "",
            customization_notes: input.customization_notes ?? "",
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "No se pudo agregar al carrito";
          throw new Error(message);
        }
        return;
      }

      let rejected = false;
      setGuestItems((prev) => {
        const existing = prev.find(
          (i) => i.productId === input.id && i.variantId === input.variantId
        );
        if (!allowBackorder && quantity > input.variantStockQuantity) {
          rejected = true;
          return prev;
        }

        const variantImages = input.variantImages ?? [];
        const productImages = input.images ?? [];
        const options = input.variantOptions ?? [];

        const next = existing
          ? prev.map((i) =>
              i === existing
                ? {
                    ...i,
                    quantity,
                    stockQuantity: input.variantStockQuantity,
                    allowBackorder,
                  }
                : i
            )
          : [
              ...prev,
              {
                id: crypto.randomUUID(),
                productId: input.id,
                variantId: input.variantId,
                name: input.name,
                slug: input.slug,
                image: variantImages[0] ?? productImages[0] ?? "",
                price: input.variantPrice,
                quantity,
                stockQuantity: input.variantStockQuantity,
                allowBackorder,
                customization_text: input.customization_text ?? "",
                customization_notes: input.customization_notes ?? "",
                optionsLabel: buildOptionsLabel(options),
                selectedOptions: buildSelectedOptions(options),
              } satisfies CartItem,
            ];
        saveGuestCart(next);
        return next;
      });

      if (rejected) {
        throw new Error(stockExceededMessage(input.variantStockQuantity));
      }
    },
    [isAuthenticated, addItemMutation]
  );

  const updateQuantity = useCallback(
    async (cartItemId: string, quantity: number) => {
      if (isAuthenticated) {
        setUpdatingItemId(cartItemId);
        try {
          await updateItemMutation.mutateAsync({ cart_item_id: cartItemId, quantity });
          await refreshCart();
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "No se pudo actualizar la cantidad";
          throw new Error(message);
        } finally {
          setUpdatingItemId(null);
        }
        return;
      }

      let rejectedStock: number | null = null;
      setGuestItems((prev) => {
        const item = prev.find((i) => i.id === cartItemId);
        if (!item) return prev;

        if (
          quantity > 0 &&
          !item.allowBackorder &&
          quantity > item.stockQuantity
        ) {
          rejectedStock = item.stockQuantity;
          return prev;
        }

        const next =
          quantity === 0
            ? prev.filter((i) => i.id !== cartItemId)
            : prev.map((i) => (i.id === cartItemId ? { ...i, quantity } : i));
        saveGuestCart(next);
        return next;
      });

      if (rejectedStock !== null) {
        throw new Error(stockExceededMessage(rejectedStock));
      }
    },
    [isAuthenticated, updateItemMutation, refreshCart]
  );

  const removeItem = useCallback(
    async (cartItemId: string) => {
      if (isAuthenticated) {
        setUpdatingItemId(cartItemId);
        try {
          await removeItemMutation.mutateAsync({ cart_item_id: cartItemId });
          await refreshCart();
        } finally {
          setUpdatingItemId(null);
        }
      } else {
        setGuestItems((prev) => {
          const next = prev.filter((i) => i.id !== cartItemId);
          saveGuestCart(next);
          return next;
        });
      }
    },
    [isAuthenticated, removeItemMutation, refreshCart]
  );

  const isItemUpdating = useCallback(
    (cartItemId: string) => updatingItemId === cartItemId,
    [updatingItemId]
  );

  const clear = useCallback(async () => {
    if (isAuthenticated) {
      await clearMutation.mutateAsync();
      await refreshCart();
    } else {
      clearGuestCart();
      setGuestItems([]);
    }
  }, [isAuthenticated, clearMutation, refreshCart]);

  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );

  const isLoading = isAuthenticated && listQuery.isLoading;

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      totalItems,
      subtotal,
      isLoading,
      isAuthenticated,
      updatingItemId,
      isItemUpdating,
      addItem,
      updateQuantity,
      removeItem,
      clear,
    }),
    [
      items,
      totalItems,
      subtotal,
      isLoading,
      isAuthenticated,
      updatingItemId,
      isItemUpdating,
      addItem,
      updateQuantity,
      removeItem,
      clear,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}
