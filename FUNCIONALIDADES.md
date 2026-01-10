# Funcionalidades de la Aplicación

## E-Commerce de Impresiones en Madera

---

## 📋 Resumen General

Plataforma de comercio electrónico especializada en la venta de impresiones en madera hechas con cortadora láser. Sistema completo con gestión de productos, pagos manuales, administración, y seguimiento de órdenes.

---

## 1. Usuarios y Perfiles

### ✅ Registro y Autenticación

- Registro de usuarios con email y contraseña
- Inicio de sesión seguro
- Recuperación de contraseña

### ✅ Perfil de Usuario

- Información personal (nombre, email, teléfono)
- Foto de perfil
- Fecha de nacimiento
- Eliminación lógica de cuenta (soft delete)

### ✅ Direcciones de Envío

- Gestión de múltiples direcciones
- Dirección predeterminada
- Campos completos: calle, ciudad, estado, código postal, país
- Una dirección marcada como principal

---

## 2. Catálogo de Productos

### ✅ Categorías

- Organización por categorías
- Categorías con sub-categorías (jerarquía)
- Imagen representativa por categoría
- URL amigable (slug)

### ✅ Productos

- Nombre y descripción detallada
- Descripción corta para listados
- Precio de venta
- Precio comparativo (para mostrar descuentos)
- Material del producto (tipo de madera)
- SKU único para control de inventario

#### ⭐ Opciones Configurables

- Múltiples dimensiones por producto (ej: 90cm, 90x40cm, 120x60cm)
- Múltiples opciones de grosor (ej: 3mm, 5.5mm, 6mm)
- Cada producto puede tener sus propias opciones únicas

#### 📦 Control de Inventario

- Cantidad disponible en stock
- Alerta de stock bajo (umbral configurable)
- Opción de venta bajo pedido cuando no hay stock

#### 🖼️ Galería de Imágenes

- Múltiples imágenes por producto
- Orden personalizable
- Imagen destacada

#### 🔍 SEO

- Meta título y descripción
- URLs amigables
- Productos destacados
- Estado activo/inactivo

### ✅ Búsqueda y Filtros

- Por categoría
- Por rango de precio
- Por disponibilidad
- Productos destacados

---

## 3. Carrito de Compras

### ✅ Funcionalidades del Carrito

- Persistente en base de datos (no se pierde al cerrar sesión)
- Soporte para usuarios registrados y anónimos
- Añadir/eliminar productos
- Modificar cantidades
- Guardar opciones seleccionadas (dimensión y grosor)
- Notas de personalización por producto
- Precio fijo al momento de agregar (no cambia si el producto sube)

### ✅ Validaciones Automáticas

- Verificación de disponibilidad de stock
- Cálculo automático de precios
- Un mismo producto con diferentes opciones = items separados

---

## 4. Métodos de Pago

### ✅ Sistema de Pagos Manuales

Sin integración con pasarelas de pago. El cliente selecciona el método, realiza el pago externamente, y sube el comprobante.

### ✅ Métodos Disponibles (configurables por el administrador)

#### 1. Transferencia Bancaria

- Datos bancarios completos
- Número de cuenta
- Titular y RIF
- **Requiere:** Número de referencia + Comprobante

#### 2. Pago Móvil

- Banco y teléfono del titular
- Cédula del titular
- **Requiere:** Número de referencia + Comprobante

#### 3. Zelle

- Email o teléfono para recibir pago
- **Requiere:** Número de confirmación
- **No requiere** comprobante

#### 4. Zinli

- Usuario Zinli
- Email y teléfono
- **Requiere:** Número de confirmación + Comprobante

#### 5. Binance

- ID de Binance
- Monedas aceptadas (USDT, BUSD, BTC)
- **Requiere:** Hash de transacción (TxID) + Comprobante

### ✅ Proceso de Pago

1. Cliente selecciona método en checkout
2. Sistema muestra datos de pago completos
3. Cliente realiza pago externamente
4. Cliente sube captura del comprobante
5. Cliente ingresa número de referencia/transacción
6. Admin verifica y confirma el pago manualmente

---

## 5. Sistema de Tasas de Cambio

### ✅ Actualización Automática de Tasas

- Consulta automática diaria de tasas de cambio
- **Fuentes de información:**
  - **Tasa BCV** (Banco Central de Venezuela) - Dólar oficial
  - **Tasa USDT Binance** - Dólar paralelo (valor real en el mercado)
- Endpoint automático que actualiza las tasas cada 24 horas

### ✅ Gestión de Precios y Monedas

- Todos los productos se registran en **DÓLARES (USD)**
- Sistema multi-moneda: **USD** y **VES** (Bolívares)
- Los métodos de pago están clasificados por moneda:
  - **VES:** Transferencia Bancaria, Pago Móvil
  - **USD:** Zelle, Zinli, Binance

### ✅ Conversión y Visualización

- Los precios se muestran automáticamente en ambas monedas:
  - Precio base en USD (precio real del producto)
  - Precio equivalente en VES (calculado con las tasas actuales)
- El cliente ve: **"$45.00 USD / Bs. 1,620.00 VES"**
- La conversión se calcula en tiempo real usando las tasas del día

### ✅ Ventajas del Sistema

- Precios siempre actualizados según el mercado
- Transparencia para el cliente (ve ambas monedas)
- Flexibilidad para pagar en la moneda que prefiera
- Usa tasa real del mercado (USDT) no solo la oficial (BCV)
- No requiere actualización manual de precios
- El admin solo gestiona precios en USD

### ✅ Flujo de Precios

1. Admin establece precio del producto: `$45.00 USD`
2. Sistema consulta tasa actual (ej: `1 USD = 36 VES`)
3. Cliente ve en catálogo:
   - `$45.00 USD`
   - `Bs. 1,620.00 VES` (45 x 36)
4. Cliente elige método de pago según su preferencia:
   - Si paga en VES → usa Transferencia o Pago Móvil
   - Si paga en USD → usa Zelle, Zinli o Binance
5. El monto a pagar se calcula según la moneda elegida

---

## 6. Órdenes y Seguimiento

### ✅ Creación de Órdenes

- Número de orden único y legible (formato: `YY000001`)
- Copia de información de envío (se preserva históricamente)
- Copia de productos y precios al momento de la compra
- Totales: Subtotal, impuestos, envío, descuentos, total

### ✅ Estados de la Orden

| Estado              | Descripción                                  |
| ------------------- | -------------------------------------------- |
| `PENDING`           | Orden creada, esperando confirmación de pago |
| `PAYMENT_CONFIRMED` | Pago verificado por el administrador         |
| `PROCESSING`        | En producción/preparación                    |
| `SHIPPED`           | Enviado (con número de seguimiento)          |
| `DELIVERED`         | Entregado al cliente                         |
| `CANCELLED`         | Cancelado                                    |
| `REFUNDED`          | Reembolsado                                  |

### ✅ Seguimiento

- Historial completo de la orden
- Número de rastreo del envío
- Fechas de cada estado
- Comprobante de pago almacenado
- Notas del cliente y del administrador

### ✅ Histórico Protegido

- Si un producto cambia de precio, la orden mantiene el precio pagado
- Si un producto se elimina, la información permanece en la orden
- Las dimensiones y opciones seleccionadas se preservan

---

## 7. Reseñas y Calificaciones

### ✅ Sistema de Reseñas

- Calificación de 1 a 5 estrellas
- Título y comentario
- Solo usuarios que compraron pueden reseñar
- Una reseña por producto por usuario
- Sistema de moderación (aprobación por admin)
- Verificación de compra

### ✅ Estadísticas Automáticas

- Promedio de calificaciones por producto
- Cantidad total de reseñas
- Total de ventas y revenue
- Actualización automática en tiempo real

---

## 8. Panel de Administración

### ✅ Roles de Administrador

#### Super Admin (Acceso Total)

- Gestión completa de productos
- Gestión de categorías
- Gestión de órdenes
- Gestión de usuarios
- Acceso a analytics
- Gestión de reseñas
- Gestión de otros administradores

#### Admin Personalizado

**Permisos configurables por módulo:**

- Productos
- Categorías
- Órdenes
- Usuarios
- Analytics
- Reseñas

### ✅ Gestión de Productos

- Crear, editar, eliminar productos
- Gestión de categorías
- Subir y ordenar imágenes
- Configurar opciones (dimensiones y grosores)
- Control de inventario
- Activar/desactivar productos
- Marcar como destacados

### ✅ Gestión de Órdenes

- Ver todas las órdenes
- Filtrar por estado
- Cambiar estado de orden
- Descargar comprobantes de pago
- Verificar y confirmar pagos
- Añadir número de rastreo
- Notas internas

### ✅ Gestión de Métodos de Pago

- Activar/desactivar métodos
- Editar datos de pago (cuentas bancarias, etc.)
- Personalizar instrucciones para clientes
- Configurar requisitos (referencia, comprobante)
- Orden de visualización

### ✅ Gestión de Usuarios

- Ver todos los usuarios
- Ver historial de compras por usuario
- Ver direcciones de envío
- Gestión de reseñas
- Asignar roles de administrador

### ✅ Reportes y Analytics

- Ventas totales por producto
- Revenue generado
- Productos más vendidos
- Estadísticas de reseñas
- Control de inventario
- Alertas de stock bajo

---

## 9. Seguridad y Privacidad

### ✅ Row Level Security (RLS)

- Los usuarios solo ven su propia información
- Las órdenes son privadas por usuario
- El carrito es privado por usuario
- Las reseñas se vinculan al usuario que compró
- Los admins tienen acceso según sus permisos

### ✅ Validaciones

- Precios siempre mayor o igual a cero
- Cantidades de inventario no negativas
- Email único por usuario
- SKU único por producto
- Una dirección principal por usuario
- Una reseña por producto por usuario

### ✅ Soft Delete

- Los usuarios pueden "eliminarse" sin borrar historial
- Las órdenes pasadas se mantienen
- Cumplimiento con regulaciones de datos

---

## 10. Características Especiales

### ✅ Opciones Configurables de Productos

- Sistema único donde cada producto puede tener sus propias opciones de tamaño y grosor
- Sin limitaciones de formato (90cm, 90x40cm, 5.5mm, etc.)
- El cliente selecciona las opciones antes de añadir al carrito
- Las opciones se preservan en la orden

### ✅ Carrito Persistente

- No se pierde al cerrar el navegador
- Se mantiene entre sesiones
- Conversión de carrito anónimo a usuario al registrarse

### ✅ Histórico Completo

- Todas las órdenes guardan datos exactos al momento de compra
- Precios, productos, y opciones se "congelan" en la orden
- Información de envío se copia (no se actualiza si el usuario cambia su dirección)

### ✅ Sistema de Búsqueda Optimizado

- Índices en campos comunes (slug, SKU, email)
- Búsquedas rápidas por categoría
- Filtros por precio, disponibilidad, etc.

### ✅ Actualización Automática de Estadísticas

- Las estadísticas de productos se calculan automáticamente
- Se actualizan al crear órdenes o reseñas
- No requiere cálculos manuales

### ✅ Números de Orden Secuenciales

- Formato legible: `YY000001` (año + contador)
- Fácil de comunicar por teléfono o email
- Único y auto-incrementable

---

## 11. Flujo Completo de Compra

### 1. Cliente Navega el Catálogo

- Ve productos por categoría
- Filtra y busca productos
- Ve detalles, imágenes, y opciones disponibles

### 2. Cliente Selecciona Producto

- Elige dimensión (ej: 90x40cm)
- Elige grosor (ej: 3mm)
- Añade al carrito

### 3. Cliente Revisa Carrito

- Modifica cantidades
- Elimina productos no deseados
- Ve el total

### 4. Cliente Va al Checkout

- Selecciona o añade dirección de envío
- Revisa el resumen de la orden

### 5. Cliente Selecciona Método de Pago

- Ve métodos disponibles
- Selecciona uno (ej: Transferencia Bancaria)
- Ve los datos de pago (cuenta, titular, etc.)
- Ve las instrucciones paso a paso

### 6. Cliente Realiza el Pago

- Hace la transferencia desde su banco
- Guarda el comprobante
- Regresa a la aplicación

### 7. Cliente Sube Comprobante

- Sube la captura de pantalla
- Ingresa el número de referencia
- Confirma la orden

### 8. Orden Creada

- Estado: `PENDING`
- Email de confirmación enviado
- Número de orden asignado

### 9. Admin Verifica Pago

- Ve la orden en el panel
- Descarga el comprobante
- Verifica el pago
- Cambia estado a: `PAYMENT_CONFIRMED`

### 10. Admin Procesa Orden

- Prepara el producto
- Cambia estado a: `PROCESSING`

### 11. Admin Envía Orden

- Empaca el producto
- Genera guía de envío
- Añade número de rastreo
- Cambia estado a: `SHIPPED`

### 12. Cliente Recibe Producto

- Admin marca como: `DELIVERED`
- Cliente puede dejar reseña

---

## 12. Tecnología y Base de Datos

### ✅ Plataforma

- **Supabase** (PostgreSQL)
- Autenticación integrada
- Storage para imágenes y comprobantes
- Row Level Security nativo

### ✅ Tablas Principales (12)

| #   | Tabla             | Descripción                       |
| --- | ----------------- | --------------------------------- |
| 1   | `profiles`        | Perfiles de usuario               |
| 2   | `addresses`       | Direcciones de envío              |
| 3   | `categories`      | Categorías de productos           |
| 4   | `products`        | Productos (con imágenes en JSONB) |
| 5   | `cart`            | Carritos de compra                |
| 6   | `cart_items`      | Items del carrito                 |
| 7   | `payment_methods` | Métodos de pago                   |
| 8   | `orders`          | Órdenes de compra                 |
| 9   | `order_items`     | Items de órdenes                  |
| 10  | `reviews`         | Reseñas de productos              |
| 11  | `product_stats`   | Estadísticas agregadas            |
| 12  | `admin_roles`     | Roles de administrador            |

### ✅ Características Técnicas

- Triggers automáticos para actualización de timestamps
- Funciones SQL personalizadas para permisos de admin
- Actualización automática de estadísticas
- Generación automática de números de orden
- Validaciones a nivel de base de datos

---

## 📝 Resumen

Esta aplicación proporciona una solución completa de e-commerce especializada en productos personalizables (impresiones en madera), con énfasis en:

✅ Flexibilidad de opciones de producto  
✅ Múltiples métodos de pago manuales  
✅ Sistema robusto de administración con permisos  
✅ Seguimiento completo de órdenes  
✅ Seguridad y privacidad de datos  
✅ Experiencia de usuario optimizada  
✅ Gestión eficiente de inventario  
✅ Sistema de reseñas con moderación  
✅ Histórico completo y protegido

Todo diseñado para ser fácil de usar tanto para clientes como para administradores, manteniendo la flexibilidad necesaria para un negocio de productos personalizados.

---

**Fin del Documento**
