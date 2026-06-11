import type { HeroSlide } from "./Hero.types";

export const heroSlides: HeroSlide[] = [
  {
    id: "bats-equipment",
    title: "Bates y equipamiento de béisbol",
    description:
      "Encuentra bates, pelotas y accesorios para entrenar y competir al máximo nivel.",
    href: "/productos",
    imageUrl:
      "https://imgur.com/F9UcgKz.jpg",
    imageAlt: "Bate y pelota de béisbol sobre el césped",
  },
  {
    id: "gloves-gear",
    title: "Guantes y protección profesional",
    description:
      "Protección y agarre perfecto para cada posición. Calidad que dura toda la temporada.",
    href: "/productos",
    imageUrl:
      "https://imgur.com/39Zq6oP.jpg",
    imageAlt: "Jugador de béisbol en pleno swing",
  },
  {
    id: "shop-online",
    title: "Compra online de forma segura",
    description:
      "Explora el catálogo, compara precios y paga con los métodos que prefieras.",
    href: "/productos",
    imageUrl:
      "https://i.imgur.com/Wwx4h1H.jpeg",
    imageAlt: "Compra en línea con tarjeta de crédito",
  },
];

export const HERO_AUTOPLAY_MS = 6000;
