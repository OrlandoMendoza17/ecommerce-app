# Guía de Opciones de Productos

## Resumen

Cada producto puede tener sus propias opciones personalizadas de **dimensiones** y **grosor**, sin necesidad de compartir o reutilizar opciones entre productos. Esto permite máxima flexibilidad para productos únicos.

---

## Campos en la Tabla `products`

### `dimension_options TEXT[]`

- **Tipo**: Array de texto
- **Ejemplo**: `['90cm', '90x40cm', '120x60cm']`
- **Descripción**: Lista de opciones de dimensiones disponibles para este producto específico
- **Uso**: El admin configura las opciones disponibles al crear/editar el producto

### `thickness_options TEXT[]`

- **Tipo**: Array de texto
- **Ejemplo**: `['5.5mm', '3mm', '6mm']`
- **Descripción**: Lista de opciones de grosor disponibles para este producto específico
- **Uso**: El admin configura las opciones disponibles al crear/editar el producto

---

## Flujo de Uso

### 1️⃣ **Admin crea/edita producto**

```sql
-- Ejemplo: Crear un producto con múltiples opciones
INSERT INTO products (
  name,
  dimension_options,
  thickness_options,
  price
) VALUES (
  'Grabado Paisaje de Montaña',
  ARRAY['90cm', '90x40cm', '120x60cm'],  -- 3 opciones de tamaño
  ARRAY['5.5mm', '3mm'],                  -- 2 opciones de grosor
  45000
);
```

**Frontend (Admin Panel):**

```typescript
// Inputs dinámicos para agregar/quitar opciones
const [dimensionOptions, setDimensionOptions] = useState<string[]>([""]);
const [thicknessOptions, setThicknessOptions] = useState<string[]>([""]);

// Al guardar:
await createProduct({
  name: "Grabado Paisaje",
  dimensionOptions: ["90cm", "90x40cm"],
  thicknessOptions: ["5.5mm", "3mm"],
  // ...
});
```

---

### 2️⃣ **Usuario visualiza opciones en el frontend**

```typescript
// Obtener el producto con sus opciones
const product = await getProduct(productId);

// Mostrar opciones como botones o dropdown
<select>
  {product.dimension_options.map(dim => (
    <option key={dim} value={dim}>{dim}</option>
  ))}
</select>

<select>
  {product.thickness_options.map(thick => (
    <option key={thick} value={thick}>{thick}</option>
  ))}
</select>
```

---

### 3️⃣ **Usuario añade al carrito con opciones seleccionadas**

```sql
-- Guardar en cart_items con las opciones elegidas
INSERT INTO cart_items (
  cart_id,
  product_id,
  quantity,
  selected_dimension,  -- 👈 Opción seleccionada
  selected_thickness,  -- 👈 Opción seleccionada
  customization_text   -- (opcional)
) VALUES (
  'uuid-del-carrito',
  'uuid-del-producto',
  1,
  '90x40cm',  -- Usuario eligió esta dimensión
  '3mm',      -- Usuario eligió este grosor
  'Para regalo de aniversario'
);
```

**Frontend:**

```typescript
const addToCart = async () => {
  await insertCartItem({
    cartId: userCart.id,
    productId: product.id,
    quantity: 1,
    selectedDimension: "90x40cm", // Del selector
    selectedThickness: "3mm", // Del selector
    customizationText: customText, // Si permite personalización
  });
};
```

---

### 4️⃣ **Usuario completa la orden**

```sql
-- Al crear la orden, se copian las opciones a order_items
INSERT INTO order_items (
  order_id,
  product_id,
  product_name,
  quantity,
  unit_price,
  selected_dimension,  -- 👈 Se preserva para histórico
  selected_thickness   -- 👈 Se preserva para histórico
)
SELECT
  'uuid-de-orden',
  ci.product_id,
  p.name,
  ci.quantity,
  ci.unit_price,
  ci.selected_dimension,
  ci.selected_thickness
FROM cart_items ci
JOIN products p ON p.id = ci.product_id
WHERE ci.cart_id = 'uuid-del-carrito';
```

Esto garantiza que **siempre sabrás exactamente qué opciones pidió el cliente**, incluso si el producto se edita o elimina después.

---

## Ventajas de Este Enfoque

✅ **Simplicidad**: No hay tablas adicionales ni relaciones complejas  
✅ **Flexibilidad**: Cada producto tiene sus propias opciones únicas  
✅ **Independencia**: Los productos no comparten opciones  
✅ **Histórico preservado**: Las órdenes guardan exactamente lo que se pidió  
✅ **Fácil de configurar**: El admin solo escribe strings simples  
✅ **Formato libre**: Soporta cualquier formato: "90cm", "3mm", "5.5mm", "120x60cm", etc.

---

## Consideraciones

### Múltiples Items del Mismo Producto

Si un usuario quiere el mismo producto con **diferentes opciones**, se crean **múltiples cart_items**:

```
cart_items:
  1. Producto A | 90cm | 3mm | cantidad: 2
  2. Producto A | 120x60cm | 5.5mm | cantidad: 1
```

Esto es manejado por el constraint UNIQUE:

```sql
UNIQUE(cart_id, product_id, selected_dimension, selected_thickness)
```

---

### Validación en el Frontend

Es importante validar que las opciones seleccionadas existan en el producto:

```typescript
const validateOptions = (
  product: Product,
  selectedDim: string,
  selectedThick: string
): boolean => {
  const validDimension = product.dimension_options.includes(selectedDim);
  const validThickness = product.thickness_options.includes(selectedThick);

  return validDimension && validThickness;
};
```

---

### Opciones Vacías (Sin Opciones)

Si un producto **no necesita opciones** (por ejemplo, es de tamaño único):

```sql
-- Admin deja los arrays vacíos
INSERT INTO products (
  name,
  dimension_options,
  thickness_options
) VALUES (
  'Llavero Personalizado',
  ARRAY[]::TEXT[],  -- Sin opciones de dimensión
  ARRAY[]::TEXT[]   -- Sin opciones de grosor
);
```

En el frontend:

```typescript
// Si no hay opciones, no mostrar selectores
{
  product.dimension_options.length > 0 && (
    <DimensionSelector options={product.dimension_options} />
  );
}
```

---

## Ejemplo Completo

### Producto en la DB:

```json
{
  "id": "123",
  "name": "Grabado Bosque",
  "dimension_options": ["90cm", "90x40cm", "120x60cm"],
  "thickness_options": ["5.5mm", "3mm"],
  "price": 45000
}
```

### Usuario selecciona y añade al carrito:

```json
{
  "cart_item_id": "456",
  "product_id": "123",
  "selected_dimension": "90x40cm",
  "selected_thickness": "3mm",
  "quantity": 1,
  "unit_price": 45000
}
```

### Orden finalizada (histórico):

```json
{
  "order_item_id": "789",
  "product_id": "123",
  "product_name": "Grabado Bosque",
  "selected_dimension": "90x40cm", // ✅ Guardado
  "selected_thickness": "3mm", // ✅ Guardado
  "quantity": 1,
  "unit_price": 45000
}
```

**Incluso si después el admin cambia las opciones del producto a `["100cm", "50x70cm"]` y `["4mm"]`, la orden siempre mostrará exactamente lo que el cliente pidió: "90x40cm" y "3mm".**

---

## Queries Útiles

### Ver productos con sus opciones:

```sql
SELECT
  name,
  dimension_options,
  thickness_options,
  price
FROM products
WHERE is_active = TRUE;
```

### Ver items del carrito con opciones:

```sql
SELECT
  p.name AS producto,
  ci.selected_dimension AS dimension,
  ci.selected_thickness AS grosor,
  ci.quantity AS cantidad,
  ci.unit_price AS precio
FROM cart_items ci
JOIN products p ON p.id = ci.product_id
WHERE ci.cart_id = 'uuid-del-carrito';
```

### Ver órdenes históricas con opciones:

```sql
SELECT
  o.order_number,
  oi.product_name,
  oi.selected_dimension,
  oi.selected_thickness,
  oi.quantity,
  oi.unit_price
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
WHERE o.profile_id = auth.uid()
ORDER BY o.created_at DESC;
```

---

## Resumen

| Campo                | Tipo     | Ubicación     | Propósito                         |
| -------------------- | -------- | ------------- | --------------------------------- |
| `dimension_options`  | `TEXT[]` | `products`    | Opciones disponibles de dimensión |
| `thickness_options`  | `TEXT[]` | `products`    | Opciones disponibles de grosor    |
| `selected_dimension` | `TEXT`   | `cart_items`  | Dimensión elegida por el usuario  |
| `selected_thickness` | `TEXT`   | `cart_items`  | Grosor elegido por el usuario     |
| `selected_dimension` | `TEXT`   | `order_items` | Dimensión en la orden (histórico) |
| `selected_thickness` | `TEXT`   | `order_items` | Grosor en la orden (histórico)    |

**🚀 Implementación simple, flexible y completa para opciones de producto personalizables.**
