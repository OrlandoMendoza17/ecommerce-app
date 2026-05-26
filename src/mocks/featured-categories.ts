import { MOCK_CATEGORY_DEFAULTS } from "./product.defaults";

export const featuredCategoriesMock = [
  {
    ...MOCK_CATEGORY_DEFAULTS,
    id: "1",
    name: "Electrónica",
    slug: "electronica",
    description: "Gadgets, audio y accesorios tech",
    image_url: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800",
  },
  {
    ...MOCK_CATEGORY_DEFAULTS,
    id: "2",
    name: "Hogar",
    slug: "hogar",
    description: "Decoración y artículos para el hogar",
    image_url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
  },
  {
    ...MOCK_CATEGORY_DEFAULTS,
    id: "3",
    name: "Moda",
    slug: "moda",
    description: "Ropa, calzado y accesorios",
    image_url: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800",
  },
  {
    ...MOCK_CATEGORY_DEFAULTS,
    id: "4",
    name: "Deportes",
    slug: "deportes",
    description: "Equipamiento y ropa deportiva",
    image_url: "https://images.unsplash.com/photo-1461896836934-ffe607f79e0f?w=800",
  },
] satisfies Category[];
