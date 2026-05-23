# Supabase Storage

Buckets alineados con columnas de URL/imagen en `tables/`.

| Bucket              | Tabla / columna        | Límite | Carpeta en Storage           |
| ------------------- | ---------------------- | ------ | ---------------------------- |
| `categories_images` | `categories.image_url` | 1 MB   | `{category_id}/0.{ext}`      |
| `products_images`   | `products.images`      | 5 MB   | `{product_id}/{index}.{ext}` |
| `profiles_avatars`  | `profiles.avatar_url`  | 1 MB   | `{profile_id}/0.{ext}`       |

> `order_items.product_image_url` es un snapshot copiado del producto al crear la orden; no tiene bucket propio.

## Instalación

1. Ejecuta primero `scripts/init_database.sql` (define `public.is_admin()`).
2. Regenera e instala storage:

   ```bash
   npm run build:storage
   ```

3. En **Supabase → SQL Editor**, ejecuta `scripts/init_storage.sql`.

También puedes ejecutar cada archivo en `storage/buckets/` por separado.

## Políticas

- **categories_images / products_images:** lectura pública; escritura solo admins (`is_admin()`).
- **profiles_avatars:** cada usuario gestiona su carpeta `{auth.uid()}`; admins tienen acceso completo.

## App

Constantes en el frontend (ej. `CategoriesForm.tsx`):

```ts
const CATEGORIES_IMAGES_BUCKET = "categories_images";
```

Usar los mismos nombres al implementar formularios de productos y avatares.
