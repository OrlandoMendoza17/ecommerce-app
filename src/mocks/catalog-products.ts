import { MOCK_PRODUCT_DEFAULTS } from "./product.defaults";
import { featuredProductsMock } from "./featured-products";

export const catalogProductsMock = [
  ...featuredProductsMock,
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
    id: "10",
    name: "Silla Ergonómica Oficina",
    slug: "silla-ergonomica-oficina",
    price: 189,
    compare_at_price: 229,
    images: ["https://images.unsplash.com/photo-1580480055273-fff9c8a1cb52?w=800"],
    stock_quantity: 5,
    is_featured: false,
  },
  {
    ...MOCK_PRODUCT_DEFAULTS,
    id: "11",
    name: "Set Cuchillos Cocina",
    slug: "set-cuchillos-cocina",
    price: 54,
    images: ["https://images.unsplash.com/photo-1593618998163-924c6c1f0b9e?w=800"],
    stock_quantity: 14,
    is_featured: false,
  },
  {
    ...MOCK_PRODUCT_DEFAULTS,
    id: "12",
    name: "Crema Facial Hidratante",
    slug: "crema-facial-hidratante",
    price: 28,
    images: ["https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800"],
    stock_quantity: 9,
    is_featured: true,
  },
] satisfies Product[];
