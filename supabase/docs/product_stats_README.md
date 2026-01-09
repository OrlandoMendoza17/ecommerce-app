# 📊 Tabla `product_stats` - Guía Completa

## ¿Qué es?

La tabla `product_stats` es una **tabla de cache/estadísticas** que almacena estadísticas pre-calculadas de productos para optimizar el rendimiento de tu e-commerce.

## 🎯 Problema que Resuelve

### Sin `product_stats`:

Cada vez que quieras mostrar información agregada de productos, necesitarías hacer queries costosos:

```sql
-- Obtener productos más vendidos (LENTO ❌)
SELECT 
  p.*,
  SUM(oi.quantity) as total_sales
FROM products p
JOIN order_items oi ON oi.product_id = p.id
JOIN orders o ON o.id = oi.order_id
WHERE o.status NOT IN ('cancelled', 'refunded')
GROUP BY p.id
ORDER BY total_sales DESC;

-- Calcular rating promedio (LENTO ❌)
SELECT 
  p.*,
  AVG(r.rating) as avg_rating,
  COUNT(r.id) as total_reviews
FROM products p
LEFT JOIN reviews r ON r.product_id = p.id
WHERE r.is_approved = TRUE
GROUP BY p.id;
```

**Problemas:**
- ⏱️ Queries lentos (múltiples JOINs y agregaciones)
- 📈 Empeora con más datos (miles de órdenes = segundos de espera)
- 💰 Mayor costo computacional en cada request
- 😞 Experiencia de usuario pobre (páginas lentas)

### Con `product_stats`: ⚡

```sql
-- Obtener productos más vendidos (INSTANTÁNEO ✅)
SELECT p.*, ps.total_sales, ps.average_rating
FROM products p
JOIN product_stats ps ON ps.product_id = p.id
ORDER BY ps.total_sales DESC
LIMIT 10;
```

**Beneficios:**
- ⚡ Queries 100x más rápidos
- 📊 Escalable con millones de órdenes
- 🔄 Actualización automática con triggers
- 💪 Performance consistente

## 📋 Estructura de la Tabla

```sql
CREATE TABLE product_stats (
  product_id UUID PRIMARY KEY,        -- Referencia al producto
  
  -- Estadísticas de ventas
  total_sales INTEGER DEFAULT 0,      -- Total de unidades vendidas
  total_revenue DECIMAL(12,2) DEFAULT 0, -- Revenue total generado
  
  -- Estadísticas de reseñas
  total_reviews INTEGER DEFAULT 0,    -- Número total de reseñas
  average_rating DECIMAL(3,2) DEFAULT 0, -- Rating promedio (0-5)
  
  -- Metadata
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW() -- Última actualización
);
```

## 🔄 Actualización Automática

Las estadísticas se mantienen sincronizadas automáticamente mediante **triggers**:

### 1. Cuando se crea/actualiza/elimina un `order_item`:
```sql
-- Trigger automático
CREATE TRIGGER trigger_order_items_update_stats
  AFTER INSERT OR UPDATE OR DELETE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_product_stats_from_order();
```

### 2. Cuando se crea/actualiza/elimina una `review`:
```sql
-- Trigger automático
CREATE TRIGGER trigger_reviews_update_stats
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_product_stats_from_review();
```

### Funcionamiento:
```
Cliente compra producto X
    ↓
INSERT INTO order_items (product_id = X, quantity = 2)
    ↓
🔥 TRIGGER automático se dispara
    ↓
UPDATE product_stats 
SET total_sales = total_sales + 2,
    total_revenue = total_revenue + (2 * unit_price)
WHERE product_id = X
```

## 💡 Casos de Uso Reales

### 1. **Homepage - Top Productos**

```typescript
// ✅ Query optimizado
const topProducts = await supabase
  .from('products')
  .select(`
    *,
    product_stats (
      total_sales,
      average_rating,
      total_reviews
    )
  `)
  .order('product_stats.total_sales', { ascending: false })
  .limit(10);

// Renderizar
{topProducts.map(product => (
  <ProductCard
    name={product.name}
    price={product.price}
    sales={product.product_stats.total_sales}
    rating={product.product_stats.average_rating}
    reviews={product.product_stats.total_reviews}
  />
))}
```

### 2. **Product Card - Información Social**

```jsx
// ⚡ Mostrar stats sin calcular en tiempo real
export function ProductCard({ product }) {
  return (
    <div className="product-card">
      <img src={product.featured_image_url} />
      <h3>{product.name}</h3>
      <p>${product.price}</p>
      
      {/* Información de stats */}
      <div className="stats">
        <StarRating value={product.stats.average_rating} />
        <span>({product.stats.total_reviews} reseñas)</span>
        <span className="badge">
          {product.stats.total_sales} vendidos 🔥
        </span>
      </div>
    </div>
  );
}
```

### 3. **Filtros de Búsqueda y Ordenamiento**

```typescript
// Usuario selecciona ordenar por...
const sortOptions = {
  'most-sold': 'product_stats.total_sales.desc',
  'best-rated': 'product_stats.average_rating.desc',
  'trending': 'product_stats.total_sales.desc' // Últimos 30 días
};

const products = await supabase
  .from('products')
  .select('*, product_stats(*)')
  .eq('is_active', true)
  .order(sortOptions[userSelection]);
```

### 4. **Dashboard Admin - Analytics**

```typescript
// Panel de control del administrador
async function getAdminDashboard() {
  // Top productos por ventas
  const topSellers = await supabase
    .from('product_stats')
    .select('*, products(*)')
    .order('total_sales', { ascending: false })
    .limit(5);
  
  // Top productos por rating
  const topRated = await supabase
    .from('product_stats')
    .select('*, products(*)')
    .order('average_rating', { ascending: false })
    .gte('total_reviews', 5) // Mínimo 5 reviews
    .limit(5);
  
  // Revenue total
  const { data: revenue } = await supabase
    .from('product_stats')
    .select('total_revenue.sum()');
  
  return { topSellers, topRated, revenue };
}
```

### 5. **Badges y Etiquetas Dinámicas**

```typescript
// Agregar badges basados en stats
function getProductBadges(stats) {
  const badges = [];
  
  // Bestseller
  if (stats.total_sales > 100) {
    badges.push({ 
      label: 'BESTSELLER 🔥', 
      color: 'red' 
    });
  }
  
  // Highly Rated
  if (stats.average_rating >= 4.5 && stats.total_reviews >= 10) {
    badges.push({ 
      label: '⭐ Mejor Valorado', 
      color: 'gold' 
    });
  }
  
  // Popular
  if (stats.total_sales > 50) {
    badges.push({ 
      label: '👍 Popular', 
      color: 'blue' 
    });
  }
  
  return badges;
}
```

### 6. **Recomendaciones Personalizadas**

```typescript
// Recomendar productos similares más populares
async function getSimilarProducts(categoryId, currentProductId) {
  return await supabase
    .from('products')
    .select('*, product_stats(*)')
    .eq('category_id', categoryId)
    .neq('id', currentProductId)
    .gte('product_stats.average_rating', 4.0)
    .order('product_stats.total_sales', { ascending: false })
    .limit(4);
}
```

### 7. **Email Marketing - Carritos Abandonados**

```typescript
// Incluir productos más populares en email de recuperación
async function getCarritoAbandonadoEmail(userId) {
  const cartItems = await getCartItems(userId);
  
  // Agregar "Otros también compraron" basado en stats
  const recommended = await supabase
    .from('products')
    .select('*, product_stats(*)')
    .in('category_id', cartItems.map(i => i.product.category_id))
    .order('product_stats.total_sales', { ascending: false })
    .limit(3);
  
  return {
    cartItems,
    recommended,
    message: "No te pierdas estos productos populares 🔥"
  };
}
```

### 8. **Página de Categoría - Ordenamiento Inteligente**

```typescript
// Mostrar primero los más relevantes de cada categoría
const categoryProducts = await supabase
  .from('products')
  .select('*, product_stats(*)')
  .eq('category_id', categoryId)
  .eq('is_active', true)
  // Ordenar por score compuesto: ventas + rating
  .order('(product_stats.total_sales + product_stats.average_rating * 20)', 
         { ascending: false });
```

## 📈 Consultas SQL Útiles

### Ver productos con mejor performance:
```sql
SELECT 
  p.name,
  ps.total_sales,
  ps.total_revenue,
  ps.average_rating,
  ps.total_reviews,
  (ps.total_revenue / NULLIF(ps.total_sales, 0)) as avg_price_per_unit
FROM products p
JOIN product_stats ps ON ps.product_id = p.id
WHERE ps.total_sales > 0
ORDER BY ps.total_revenue DESC
LIMIT 20;
```

### Productos con mejor rating y suficientes reviews:
```sql
SELECT 
  p.name,
  ps.average_rating,
  ps.total_reviews,
  ps.total_sales
FROM products p
JOIN product_stats ps ON ps.product_id = p.id
WHERE ps.total_reviews >= 5
ORDER BY ps.average_rating DESC, ps.total_reviews DESC
LIMIT 10;
```

### Productos que necesitan más reviews:
```sql
SELECT 
  p.name,
  ps.total_sales,
  ps.total_reviews,
  ROUND((ps.total_reviews::decimal / NULLIF(ps.total_sales, 0) * 100), 2) as review_rate_percent
FROM products p
JOIN product_stats ps ON ps.product_id = p.id
WHERE ps.total_sales > 10
  AND ps.total_reviews < 5
ORDER BY ps.total_sales DESC;
```

## 🎯 Ventajas vs Desventajas

### ✅ Ventajas:
- **Performance**: Queries 100x más rápidos
- **Escalabilidad**: Funciona con millones de registros
- **Simplicidad**: No necesitas calcular agregaciones en cada request
- **Consistencia**: Datos siempre actualizados por triggers
- **Analytics**: Dashboard y reportes sin impacto en performance
- **UX**: Usuarios ven información instantánea

### ⚠️ Desventajas:
- **Espacio**: Ocupa almacenamiento adicional (mínimo)
- **Complejidad inicial**: Requiere triggers bien configurados
- **Sincronización**: Depende de que los triggers funcionen correctamente

### Conclusión:
Las **ventajas superan ampliamente** las desventajas. Es una optimización estándar en e-commerce y aplicaciones con datos agregados.

## 🔧 Mantenimiento

### Recalcular stats manualmente si es necesario:
```sql
-- Recalcular stats de un producto específico
SELECT update_product_stats('product-uuid-aqui');

-- Recalcular stats de todos los productos
DO $$
DECLARE
  prod RECORD;
BEGIN
  FOR prod IN SELECT id FROM products LOOP
    PERFORM update_product_stats(prod.id);
  END LOOP;
END $$;
```

### Verificar integridad:
```sql
-- Productos sin stats (deberían tener)
SELECT p.id, p.name
FROM products p
LEFT JOIN product_stats ps ON ps.product_id = p.id
WHERE ps.product_id IS NULL;

-- Crear stats faltantes
INSERT INTO product_stats (product_id)
SELECT p.id FROM products p
LEFT JOIN product_stats ps ON ps.product_id = p.id
WHERE ps.product_id IS NULL;
```

## 🚀 Mejores Prácticas

1. **No modificar manualmente**: Deja que los triggers actualicen los datos
2. **Monitorear performance**: Ocasionalmente verifica que los triggers funcionen
3. **Índices importantes**: Ya están creados (`total_sales DESC`, `average_rating DESC`)
4. **Cache en frontend**: Puedes cachear estos datos por minutos en tu app
5. **Analytics separados**: Para análisis profundos, considera una tabla de eventos separada

## 📚 Recursos Adicionales

- [PostgreSQL Materialized Views](https://www.postgresql.org/docs/current/rules-materializedviews.html)
- [Database Denormalization](https://en.wikipedia.org/wiki/Denormalization)
- [Supabase Triggers](https://supabase.com/docs/guides/database/triggers)

---

**Nota**: Esta tabla es esencial para el buen performance de tu e-commerce. No la elimines sin tener una alternativa de caching en su lugar.

