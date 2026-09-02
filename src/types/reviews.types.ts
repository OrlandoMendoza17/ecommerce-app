type Review = Tables<"reviews">;

/** Producto pendiente de reseña (comprado pero sin review). */
interface ReviewPendingItem {
  product_id: string;
  product_name: string;
  product_image_url: string;
  order_id: string;
  purchased_at: string;
}

/** Reseña completada con info del producto. */
interface ReviewCompletedItem {
  id: Review["id"];
  product_id: Review["product_id"];
  rating: Review["rating"];
  title: Review["title"];
  comment: Review["comment"];
  is_approved: Review["is_approved"];
  created_at: Review["created_at"];
  updated_at: Review["updated_at"];
  product_name: string;
  product_image_url: string;
  product_slug: string;
}

/** Reseña con detalle de producto para el formulario de edición. */
interface ReviewDetail {
  id: Review["id"];
  product_id: Review["product_id"];
  rating: Review["rating"];
  title: Review["title"];
  comment: Review["comment"];
  is_approved: Review["is_approved"];
  created_at: Review["created_at"];
  updated_at: Review["updated_at"];
  product_name: string;
  product_image_url: string;
  product_slug: string;
}
