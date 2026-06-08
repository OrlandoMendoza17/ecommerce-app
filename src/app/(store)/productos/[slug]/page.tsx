import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  HydrateClient,
  getServerCaller,
  trpcServer,
} from "@/config/trpc.server.config";
import ProductDetailView from "@/components/pages/productos/ProductDetailView/ProductDetailView";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const api = await getServerCaller();
    const product = await api.products.getBySlug({ slug });

    if (!product) {
      return {
        title: "Producto no encontrado",
        description: "El producto que buscas no está disponible.",
      };
    }

    const mainImage = product.images?.[0];

    return {
      title: product.meta_title || product.name,
      description:
        product.meta_description ||
        product.description?.slice(0, 160) ||
        `Compra ${product.name} en nuestra tienda.`,
      openGraph: {
        title: product.meta_title || product.name,
        description:
          product.meta_description ||
          product.description?.slice(0, 160) ||
          `Compra ${product.name} en nuestra tienda.`,
        images: mainImage ? [{ url: mainImage, alt: product.name }] : [],
        type: "website",
      },
    };
  } catch {
    return {
      title: "Producto",
      description: "Detalles del producto.",
    };
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const api = await getServerCaller();
  const product = await api.products.getBySlug({ slug });

  if (!product) notFound();

  // Prefetch into React Query cache so the client hydrates without extra requests
  await trpcServer.products.getBySlug.prefetch({ slug });

  await trpcServer.productVariants.selectByProduct.prefetch({
    product_id: product.id,
    is_active: true,
  });

  await trpcServer.productOptionTypes.selectByProduct.prefetch({
    product_id: product.id,
  });

  if (product.category_id) {
    await trpcServer.categories.getById.prefetch({ id: product.category_id });
    await trpcServer.products.select.prefetch({
      is_active: true,
      category_id: product.category_id,
    });
  }

  return (
    <HydrateClient>
      <ProductDetailView slug={slug} />
    </HydrateClient>
  );
}
