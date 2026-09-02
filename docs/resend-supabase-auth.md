# Resend + Supabase Auth

Guía para enviar los correos de autenticación de Supabase (confirmación de registro, recuperación de contraseña, magic link) a través de **Resend** mediante **Custom SMTP**.

## Arquitectura

Hay dos canales de email independientes que comparten la misma cuenta de Resend:

| Canal | Quién envía | Cómo | Uso |
| --- | --- | --- | --- |
| Transaccional (pedidos, notificaciones) | La app (`src/lib/email/`) | SDK / API de Resend | Confirmación de pedido, pago, envío, etc. |
| Auth | Supabase Auth | SMTP → `smtp.resend.com` | Signup, reset password, magic link, cambio de email |

```
App (signUp / resetPassword / OTP)
  → Supabase Auth
    → SMTP (smtp.resend.com)
      → Resend
        → Bandeja del usuario

App (notifyOrder*)
  → Resend SDK (API)
    → Bandeja del usuario
```

No hace falta Auth Hook ni cambios en el código de Auth de la app. Los redirects ya están definidos en [`src/lib/auth.ts`](../src/lib/auth.ts).

## Variables de entorno (solo app / emails transaccionales)

Estas variables alimentan los correos de **pedidos**, no el SMTP de Auth:

```env
RESEND_API_KEY=re_...
EMAIL_FROM="Mi Tienda <onboarding@resend.dev>"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

En producción, cambia `EMAIL_FROM` a un dominio verificado en Resend (ej. `Mi Tienda <noreply@tudominio.com>`).

La API key de Auth se configura **solo en el Dashboard de Supabase** (campo Password del SMTP), no en el repo.

## Redirects que usa la app

| Flujo | Redirect |
| --- | --- |
| Confirmación de registro (`signUp`) | `{NEXT_PUBLIC_APP_URL}/auth/login` |
| Recuperación de contraseña | `{NEXT_PUBLIC_APP_URL}/auth/reset-password` |
| Magic link (`signInWithOtp`) | `{NEXT_PUBLIC_APP_URL}/perfil` |

Estos paths deben estar en la allowlist de Redirect URLs de Supabase.

---

## Configuración en el Dashboard de Supabase

### 1. Custom SMTP

**Ruta:** Authentication → Emails → SMTP Settings  
(o Project Settings → Authentication → SMTP)

Activa **Enable Custom SMTP** con:

| Campo | Valor |
| --- | --- |
| Host | `smtp.resend.com` |
| Port | `465` (SSL). Si falla, prueba `587` |
| Username | `resend` |
| Password | La misma API key de Resend (`re_...`) |
| Sender email | Modo prueba: `onboarding@resend.dev`. Producción: `noreply@tudominio.com` |
| Sender name | Nombre de la tienda |
| Minimum interval | Default (ej. 60s) |

Guarda y espera unos segundos a que el proyecto aplique el cambio.

### 2. URL Configuration

**Ruta:** Authentication → URL Configuration

**Local:**

- **Site URL:** `http://localhost:3000`
- **Redirect URLs:**
  - `http://localhost:3000/auth/login`
  - `http://localhost:3000/auth/reset-password`
  - `http://localhost:3000/perfil`
  - `http://localhost:3000/**` (opcional en desarrollo)

**Producción:** añade la URL pública y actualiza Site URL.

### 3. Provider Email

**Ruta:** Authentication → Providers → Email

- **Enable Email:** ON
- **Confirm email:** ON (recomendado; así el signup dispara el correo de confirmación)
- **Secure email change:** ON si usas cambio de email en perfil

### 4. Plantillas (opcional)

**Ruta:** Authentication → Email Templates

Puedes dejar las plantillas por defecto de Supabase. Más adelante personaliza Confirm signup, Reset password y Magic Link con el branding de la tienda. El envío seguirá saliendo por Resend SMTP.

---

## Modo prueba vs producción

### Modo prueba (sin dominio verificado)

- Sender: `onboarding@resend.dev`
- Resend solo entrega al **email de la cuenta Resend** (y a veces emails del equipo)
- Sirve para validar SMTP y los flujos de Auth

### Producción (dominio verificado en Resend)

1. Verifica el dominio en el dashboard de Resend (registros DNS).
2. Cambia `EMAIL_FROM` en la app al dominio verificado.
3. En Supabase SMTP, cambia **Sender email** al mismo dominio (`noreply@tudominio.com`).
4. Actualiza Site URL y Redirect URLs a producción.

---

## Cómo verificar

1. Registra un usuario **con el email permitido por Resend** (en trial: el de tu cuenta Resend).
2. Revisa bandeja / spam: el From debe ser `onboarding@resend.dev` (o tu dominio), **no** `@supabase.io`.
3. Prueba “Olvidé mi contraseña” con el mismo email.
4. En Resend Dashboard → **Emails / Logs** debe aparecer el envío.

### Si no llega el correo

- Revisa **Authentication → Logs** en Supabase.
- Confirma que el Password SMTP es exactamente la API key (sin comillas).
- Confirma que el destinatario es un email permitido en el plan/trial de Resend.
- Prueba el puerto `587` si `465` falla.

---

## Resumen

| Dónde | Acción |
| --- | --- |
| Código de la app | Ninguno para Auth SMTP |
| `.env.local` | `RESEND_API_KEY` + `EMAIL_FROM` (solo emails de pedidos) |
| Supabase Dashboard | Custom SMTP + URL allowlist + Email provider |
| Resend | Misma API key; From de prueba o dominio verificado |
