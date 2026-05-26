import { MOCK_PRODUCT_DEFAULTS } from "./product.defaults";

export const productDetailMock = {
  ...MOCK_PRODUCT_DEFAULTS,
  id: "1",
  name: "Auriculares Inalámbricos Pro",
  slug: "auriculares-inalambricos-pro",
  description:
    "Auriculares inalámbricos con sonido envolvente y micrófono integrado para llamadas y videoconferencias.",
  price: 89,
  compare_at_price: 119,
  images: [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
    "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800",
    "https://images.unsplash.com/photo-1583394838336-acd9777362f6?w=800",
    "https://images.unsplash.com/photo-1546435770-3d5b5c6c0c0e?w=800",
  ],
  stock_quantity: 12,
  is_featured: true,
} satisfies Product;

export const relatedProductsMock = [
  {
    ...MOCK_PRODUCT_DEFAULTS,
    id: "2",
    name: "Reloj Smart Fitness",
    slug: "reloj-smart-fitness",
    price: 129,
    images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800"],
    stock_quantity: 10,
    is_featured: false,
  },
  {
    ...MOCK_PRODUCT_DEFAULTS,
    id: "4",
    name: "Mochila Urbana 20L",
    slug: "mochila-urbana-20l",
    price: 45,
    compare_at_price: 59,
    images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800"],
    stock_quantity: 20,
    is_featured: false,
  },
  {
    ...MOCK_PRODUCT_DEFAULTS,
    id: "9",
    name: 'Tablet 10" WiFi',
    slug: "tablet-10-wifi",
    price: 199,
    images: ["https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800"],
    stock_quantity: 18,
    is_featured: true,
  },
  {
    ...MOCK_PRODUCT_DEFAULTS,
    id: "5",
    name: "Lámpara LED Escritorio",
    slug: "lampara-led-escritorio",
    price: 34,
    images: ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800"],
    stock_quantity: 9,
    is_featured: true,
  },
] satisfies Product[];
