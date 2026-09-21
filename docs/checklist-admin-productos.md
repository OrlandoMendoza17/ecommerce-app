# Checklist de funcionalidades: Admin Productos (`/admin/products`)

Prioridad de mayor a menor.  
`[x]` = implementado en código · `[ ]` = no implementado / propuesta de mejora.

Documento de referencia para el módulo de administración de catálogo de productos en [src/app/admin/products/page.tsx](file:///Users/orlandomendoza/Desktop/webs/ecommerce-app/src/app/admin/products/page.tsx).

---

## 1. Ya listo — Base funcional actual

- [x] Listado paginado con TanStack Table (`useTablePagination`)
- [x] Búsqueda por texto libre: nombre, slug y descripción / SKU (`useTableSearch`)
- [x] Filtros estándar: estado (activo/inactivo), destacado (sí/no), tipo (digital/físico), fecha de registro
- [x] Miniatura de imagen con fallback y enlace directo para previsualizar en tienda (`/productos/[slug]`)
- [x] Nombre de producto con enlace directo a edición (`/admin/products/update/[id]`)
- [x] Formato de precio en moneda local/USD (`formatCurrency`)
- [x] Columna de cantidad de stock (`stock_quantity`)
- [x] Badge/estado de visibilidad (Activo / Inactivo) e indicador de producto destacado
- [x] Acciones de fila: Editar, Copiar enlace público de la tienda, Eliminar (con modal y mutación tRPC)
- [x] Cabecera con título, descripción y botón "Crear producto" (`/admin/products/create`)

---

## 2. Alta prioridad — Control de inventario y agilidad operativa

Funcionalidades esenciales para supervisar el stock y gestionar productos rápidamente sin fricción.

### 2.1 Tarjetas de métricas y KPIs (Header Stats)

- [ ] Total de productos registrados (con desglose de activos vs. inactivos)
- [ ] Contador de alerta: **Stock Bajo** (productos con stock $\le 5$)
- [ ] Contador de alerta: **Agotados** (productos con stock $= 0$)
- [ ] Total de productos **Destacados** en portada
- [ ] Filtro rápido interactivo: hacer clic en una tarjeta aplica el filtro correspondiente en la tabla

### 2.2 Pestañas de estado rápido (Quick Status Tabs)

- [ ] Barra de pestañas sobre la tabla: `Todos` · `Activos` · `Inactivos / Borradores` · `Stock bajo` · `Agotados` · `Destacados`
- [ ] Preservar la sincronización del filtro con la URL (`?status=active`, etc.)

### 2.3 Edición rápida en línea (Inline Quick Actions)

- [ ] Switch directo en la columna **Estado** para activar/desactivar producto con un solo clic (`trpc.products.update`)
- [ ] Switch / Toggle rápido en la columna **Destacado**
- [ ] Edición rápida de **Stock** mediante popover/input inline sin abrir la pantalla completa de edición
- [ ] Edición rápida de **Precio** mediante popover/input inline

---

## 3. Media prioridad — Operaciones en lote y filtros avanzados

Optimizaciones para catálogos medianos y grandes que requieren gestión masiva.

### 3.1 Acciones masivas (Bulk / Batch Actions)

- [x] Checkboxes de selección de filas en la tabla (`Table.RowSelection`) y checkbox maestro ("Seleccionar todos")
- [x] Barra flotante contextual al seleccionar uno o más productos
- [x] **Cambio de estado masivo:** Activar o desactivar todos los productos seleccionados
- [x] **Destacado masivo:** Marcar o desmarcar como destacados en lote
- [x] **Asignación masiva:** Cambiar de categoría o marca en lote
- [x] **Ajuste de precio en lote:** Aplicar incremento o descuento porcentual a los seleccionados
- [x] **Eliminación masiva:** Borrado múltiple con modal de confirmación y advertencia

### 3.2 Filtros avanzados dinámicos

- [ ] Filtro dinámico por **Categoría** (cargado desde `trpc.categories.select`)
- [ ] Filtro dinámico por **Marca** (cargado desde `trpc.brands.select`)
- [ ] Filtro por **Nivel de Stock**: *En stock* | *Stock bajo ($\le 5$)* | *Agotado ($= 0$)*
- [ ] Filtro por **Rango de Precio**: *Precio mínimo* y *Precio máximo*

### 3.3 Duplicar / Clonar producto

- [x] Botón "Duplicar" en el menú de acciones de fila (`Table.RowActions`)
- [x] Generar una copia con estado inactivo (`is_active: false`), nombre `[Nombre Original] (Copia)` y manteniendo categorías, descripción, atributos y variantes

---

## 4. Útil / Valor agregado — Variantes, exportación e integraciones

Herramientas para integración con almacén físico, auditorías y enriquecimiento del catálogo.

### 4.1 Visualización y desglose de variantes

- [ ] Badge en la tabla indicando el total de variantes (ej. `3 variantes`)
- [ ] Fila expandible (Accordion / Sub-row) para ver desglose de variantes (tallas, colores, SKU y stock específico) sin salir del listado

### 4.2 Exportación e importación de catálogo (CSV / Excel / PDF)

- [x] Botón **"Exportar"** en el Toolbar de la tabla (en línea a la derecha, responsivo), con selector de formato (CSV, Excel `.xlsx`, PDF `.pdf`) y alcance (vista filtrada actual o catálogo completo)
- [x] Modal **"Importar"** universal compatible con Excel (`.xlsx`, `.xls`) y CSV (`.csv`), con descarga de plantillas en ambos formatos, previsualización responsiva y validación por fila

### 4.3 Reseñas y calidad de producto

- [ ] Columna o tooltip con calificación promedio en estrellas (⭐) y total de reseñas recibidas
- [ ] Acceso directo desde la fila a `/admin/reviews?productId=[id]` para moderar las opiniones de ese producto

### 4.4 Etiquetas y códigos QR / Barras

- [ ] Acción de fila para generar e imprimir etiqueta de producto con código QR / barras apuntando a la URL pública de la tienda (`/productos/[slug]`) y precio

---

## Notas de arquitectura y dependencias

- **Componentes base:** [Table](file:///Users/orlandomendoza/Desktop/webs/ecommerce-app/src/components/global/Table/Table.tsx), [FeatureHeader](file:///Users/orlandomendoza/Desktop/webs/ecommerce-app/src/components/widgets/FeatureHeader/FeatureHeader.tsx), [StatCard](file:///Users/orlandomendoza/Desktop/webs/ecommerce-app/src/components/global/StatCard/StatCard.tsx).
- **Routers tRPC relacionados:**
  - `trpc.products`: mutaciones `update`, `insert`, `delete` y queries de consulta.
  - `trpc.product_variants`: consulta y edición de stock por variante.
  - `trpc.categories` y `trpc.brands`: proveedores para selects dinámicos de filtrado.
  - `trpc.reviews` / `trpc.products.getStats`: métricas de satisfacción y reseñas.
