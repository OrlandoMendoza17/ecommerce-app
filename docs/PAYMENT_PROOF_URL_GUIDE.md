# Guía: comprobantes de pago (`proof_url` → `payment_proof_url`)

Guía portable para implementar la subida de comprobantes en formularios de pagos. Patrón de referencia: `CreatePaymentForm` y `PlatformPaymentForm`.

Pensada para copiar en otro proyecto o pasarla como contexto a un agente de IA en Cursor.

---

## Referencia en este repositorio

| Archivo                                                                                                   | Descripción                                  |
| --------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `src/validations/payments.validations.ts`                                                                 | Validación entidad (API) y formulario (UI)   |
| `src/components/pages/admin/payments/AddPaymentModal/CreatePaymentForm/CreatePaymentForm.helpers.ts`      | Schema y `defaultValues` del formulario club |
| `src/components/pages/admin/payments/AddPaymentModal/CreatePaymentForm/CreatePaymentForm.tsx`             | Submit + JSX (formulario club)               |
| `src/components/pages/platform/payments/PlatformPaymentModal/PlatformPaymentForm/PlatformPaymentForm.tsx` | Misma convención (formulario plataforma)     |
| `src/components/form/FormFileInput/FormFileInput.tsx`                                                     | Componente dropzone                          |
| `src/utils/supabase/storage/uploadFiles.ts`                                                               | Subida a Storage                             |
| `src/sql/tables/clubs/payments.sql`                                                                       | Columna `payment_proof_url` (JSONB)          |

---

## 1. Convención de nombres (importante)

Este patrón usa **dos nombres distintos** a propósito:

| Contexto                           | Nombre del campo    | Tipo                |
| ---------------------------------- | ------------------- | ------------------- |
| Formulario (react-hook-form + Zod) | `proof_url`         | `File[]` (opcional) |
| API / tRPC / Base de datos         | `payment_proof_url` | `string[]`          |

**Por qué dos nombres:**

- En el formulario solo existen archivos locales (`File`) pendientes de subir.
- En la API/BD solo existen URLs ya subidas a Storage.
- El `submitHandler` hace la traducción: sube `proof_url` → obtiene URLs → envía `payment_proof_url`.

> No mezclar nombres en el formulario. El `FormFileInput` debe usar `name="proof_url"`, **no** `name="payment_proof_url"`.

---

## 2. Concepto vs patrón `logo_url`

| Aspecto                  | `logo_url` (equipos/clubes)                  | `proof_url` (pagos)                               |
| ------------------------ | -------------------------------------------- | ------------------------------------------------- |
| Campo en formulario      | `(string \| File)[]`                         | `File[]`                                          |
| Campo en API/BD          | `string` (una URL)                           | `string[]` (varias URLs)                          |
| Nombre distinto form/API | No (mismo nombre, distinto tipo)             | **Sí** (`proof_url` → `payment_proof_url`)        |
| Cuándo se sube           | Create: después del `insert` (necesita `id`) | **Antes** del `insert` (carpeta por club/usuario) |
| Obligatoriedad           | Opcional                                     | Opcional                                          |
| Tipo en BD               | `TEXT`                                       | `JSONB` (array JSON)                              |

---

## 3. Base de datos

```sql
payment_proof_url JSONB NOT NULL DEFAULT '[]'::jsonb
```

- Almacena un array JSON de URLs: `["https://...", "https://..."]`.
- Permite cero, uno o varios comprobantes por pago.

---

## 4. Validación en dos capas — `payments.validations.ts`

### 4.1 Entidad / API (`paymentValidation`)

El schema de entidad y tRPC usa `payment_proof_url` como **array de strings**:

```ts
payment_proof_url: z.array(z.string()).default([]),
```

Este campo forma parte de:

- `vPayment.db()` — schema completo de la entidad
- `vPayment.insert()` — hereda `payment_proof_url` como `string[]`
- `vPayment.update()` — partial del entity schema

**Regla:** las mutaciones `payments.insert` / `payments.update` reciben `payment_proof_url: string[]`, nunca `File[]`.

### 4.2 Formulario UI (`createFormValidation`)

Schema dedicado al frontend. Usa `proof_url` como **array de Files opcional**:

```ts
// Schema específico para el formulario de creación (frontend)
// Usa proof_url: File[] para la subida de archivos; payment_proof_url se arma en el submit
const createFormValidation = () => {
  return z.object({
    transaction_type: z.enum(["income", "expense"]),
    amount: z.coerce.number().min(0),
    currency: z.enum(["USD", "EUR", "VES"]),
    payment_date: z.string().date(),
    payment_category_id: z.uuid(),
    description: z.string(),
    status: z.enum(["submitted", "verified", "rejected"]),
    payment_reference: z.string(),
    // File[] en el formulario; se convierte a string[] antes de llamar al router
    proof_url: z.array(z.instanceof(File)).optional(),
    member_enrollment_id: z.uuid().nullable().optional(),
    payment_method_id: z.uuid().nullable().optional(),
    account_id: z.uuid(),
    member_id: z.uuid().nullable().optional(),
  });
};
```

Existe también `vPayment.platformPaymentForm()` con la misma regla para `proof_url`.

**Nota:** `vPayment.updateForm()` **no** incluye `proof_url`; la edición de comprobantes en pagos existentes sigue otro flujo o se resetea a `[]` en edición.

### 4.3 Export

```ts
export const vPayment = {
  db: paymentValidation,
  insert: insertValidation,
  createForm: createFormValidation, // ← formulario club
  platformPaymentForm: platformPaymentFormValidation,
  updateForm: updateFormValidation,
  // ...
};
```

---

## 5. Helpers del formulario — `CreatePaymentForm.helpers.ts`

```ts
import { PAYMENT_CATEGORY_IDS } from "@/constants/payment-categories";
import { vPayment } from "@/validations/payments.validations";
import { CreatePaymentForm } from "./CreatePaymentForm.types";

export const createFormSchema = vPayment.createForm();

export const defaultValues: CreatePaymentForm = {
  transaction_type: "income" as const,
  amount: 0,
  currency: "USD",
  payment_date: new Date().toISOString().split("T")[0],
  status: "verified" as const,
  payment_category_id: PAYMENT_CATEGORY_IDS.other,
  description: "",
  payment_reference: "",
  proof_url: [] as File[], // ← array vacío, sin comprobante
  member_enrollment_id: null,
  member_id: null,
  payment_method_id: null,
  account_id: "",
};
```

### Tipos — `CreatePaymentForm.types.ts`

```ts
import { z } from "zod";
import { createFormSchema } from "./CreatePaymentForm.helpers";

export type CreatePaymentForm = z.infer<typeof createFormSchema>;
```

---

## 6. Inicialización del formulario — `CreatePaymentForm.tsx`

En creación de pagos **no hay precarga de comprobantes** desde BD (solo archivos nuevos):

```tsx
const form = useForm<CreatePaymentForm>({
  resolver: zodResolver(createFormSchema) as any,
  defaultValues, // proof_url: []
});
```

En edición de pagos de plataforma (`PlatformPaymentForm`), los comprobantes existentes **no** se cargan en el form; se reinicia:

```ts
proof_url: [],   // en getUpdateDefaultValues(payment)
```

---

## 7. JSX — `FormFileInput`

Debe estar dentro de `<Form {...form}>`.

**Implementación correcta** (como en `PlatformPaymentForm`):

```tsx
<FormFileInput
  name="proof_url" // ← nombre del campo en el form schema
  label="Comprobante de Pago"
  description="Sube el comprobante o foto del pago (opcional). Máximo 1MB"
  bucket="proofs"
  maxFiles={1}
  multiple={false}
  maxSize={1024 * 1024}
/>
```

| Prop       | Valor típico              | Notas                                              |
| ---------- | ------------------------- | -------------------------------------------------- |
| `name`     | `"proof_url"`             | Debe coincidir con el schema Zod del formulario    |
| `bucket`   | `"proofs"`                | Bucket de Supabase Storage                         |
| `folder`   | No se usa en create       | A diferencia de logos, no se precarga por `folder` |
| `maxFiles` | `1` o más                 | Un comprobante o varios según negocio              |
| `multiple` | `false` si `maxFiles={1}` |                                                    |
| `maxSize`  | `1024 * 1024`             | 1 MB                                               |

> **Atención:** en `CreatePaymentForm.tsx` el JSX actual usa `name="payment_proof_url"`, lo cual **no coincide** con el schema (`proof_url`). Al implementar en otro proyecto, usar `name="proof_url"`.

---

## 8. Lógica de submit — `CreatePaymentForm.tsx`

Flujo completo (líneas 46–104):

```tsx
const submitHandler: SubmitHandler<CreatePaymentForm> = async (data) => {
  if (!club_id) {
    errorToast(new Error("No hay club seleccionado"));
    return;
  }

  if (!user?.id) {
    errorToast(new Error("No hay usuario autenticado"));
    return;
  }

  // 1) Subir archivos de comprobante si existen
  let payment_proof_url: string[] = [];
  if (data.proof_url && data.proof_url.length > 0) {
    try {
      const folder = `payments/${club_id}/${user.id}`;
      const bucket = "proofs";
      payment_proof_url = await uploadFiles({
        files: data.proof_url,
        folder,
        bucket,
      });
    } catch (error) {
      console.error(error);
      errorToast(new Error("Error al subir el comprobante"));
      return; // abortar: no insertar pago si falló la subida
    }
  }

  // 2) Resolver otros campos del formulario (ej. member_id)
  let member_id: string | null = null;
  if (data.member_id) {
    const member = members.find((m) => m.profile_id === data.member_id);
    if (member) member_id = member.id;
  }

  // 3) Excluir proof_url del payload (es solo del formulario)
  const { proof_url: _, ...formData } = data;

  // 4) Insert con payment_proof_url (string[])
  await insertPayment.mutateAsync({
    ...formData,
    payment_scope: "club",
    club_id,
    recorded_by: user.id,
    payment_proof_url, // ← string[], no File[]
    member_id,
    payment_category_id: formData.payment_category_id,
  });

  toast({ title: "Pago registrado" /* ... */ });
  await utils.payments.invalidate();
  onClose?.();
};
```

### Pasos del submit (checklist)

1. Validar contexto (`club_id`, `user.id`, etc.).
2. Si `data.proof_url?.length > 0` → `uploadFiles` → `payment_proof_url: string[]`.
3. Si no hay archivos → `payment_proof_url = []`.
4. Si falla la subida → **return** (no llamar al insert).
5. Destructurar y **omitir** `proof_url` del spread al API.
6. Llamar `insertPayment` / `updatePayment` con `payment_proof_url`.

### Convención de carpeta en Storage

```
{bucket}/{folder}/{index}.{ext}

Ejemplo:
  bucket:  proofs
  folder:  payments/{club_id}/{user.id}
  archivo: proofs/payments/abc-club-uuid/xyz-user-uuid/0.jpg
```

No depende del `id` del pago (a diferencia del logo de equipos). El pago se inserta **después** de subir.

---

## 9. Variante: `PlatformPaymentForm`

Misma convención, scope distinto:

```tsx
const folder = `payments/${data.club_id}/${user.id}`;

let payment_proof_url: string[] = [];
if (data.proof_url && data.proof_url.length > 0) {
  payment_proof_url = await uploadFiles({
    files: data.proof_url,
    folder,
    bucket: "proofs",
  });
}

const { proof_url: _, id, ...rest } = data;

await insertPayment.mutateAsync({
  ...rest,
  payment_scope: "platform",
  recorded_by: user.id,
  payment_proof_url,
});
```

En **update**, solo envía `payment_proof_url` si hubo archivos nuevos:

```tsx
...(payment_proof_url.length > 0 && { payment_proof_url }),
```

---

## 10. Diagrama del flujo

```
┌─────────────────┐     ┌─────────────────────┐     ┌──────────────────┐
│  FormFileInput  │────▶│ proof_url: File[]   │────▶│  uploadFiles()   │
│  name=proof_url │     │ (opcional)          │     │  bucket: proofs  │
└─────────────────┘     └─────────────────────┘     └────────┬─────────┘
                                                               │
                                                               ▼
                                                    payment_proof_url: string[]
                                                               │
                                                               ▼
                                              ┌────────────────────────────┐
                                              │ payments.insert (tRPC)     │
                                              │ payment_proof_url: string[]│
                                              └─────────────┬──────────────┘
                                                            ▼
                                              ┌────────────────────────────┐
                                              │ DB: payment_proof_url JSONB│
                                              │ ["url1", "url2", ...]      │
                                              └────────────────────────────┘
```

---

## 11. Utilidad `uploadFiles`

```ts
uploadFiles({
  files: File[],
  folder: string,   // ej. "payments/{club_id}/{user_id}"
  bucket: string,   // ej. "proofs"
}): Promise<string[]>
```

- Sube cada archivo como `{folder}/{index}.{ext}`.
- Retorna array de URLs (firmadas o públicas según tu `storage.client`).
- Si `files` está vacío, retorna `[]`.

---

## 12. Lectura en UI (comprobantes guardados)

Al mostrar un pago existente, usar `payment.payment_proof_url` como `string[]`:

```tsx
{Array.isArray(payment.payment_proof_url) && payment.payment_proof_url.length > 0 && (
  payment.payment_proof_url.map((url, index) => (
  // renderizar imagen/enlace por URL
  ))
)}
```

Referencias: `MonthlyFeeVerificationModal`, `EnrollmentFeeVerificationModal`.

---

## 13. Checklist de implementación

- [ ] `payments.validations.ts`: `payment_proof_url: z.array(z.string()).default([])` en entity/insert
- [ ] `vPayment.createForm()`: `proof_url: z.array(z.instanceof(File)).optional()`
- [ ] `defaultValues.proof_url = [] as File[]`
- [ ] `FormFileInput` con `name="proof_url"` (no `payment_proof_url`)
- [ ] `FormFileInput` dentro de `<Form {...form}>`
- [ ] Submit: subir `data.proof_url` → `payment_proof_url: string[]`
- [ ] Submit: `const { proof_url: _, ...formData } = data` antes del mutate
- [ ] Submit: abortar si falla `uploadFiles`
- [ ] Mutación recibe `payment_proof_url`, nunca `proof_url`
- [ ] Bucket `proofs` (o equivalente) creado en Storage

---

## 14. Errores frecuentes

| Problema                               | Causa                                                                      | Solución                                                            |
| -------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Archivos no llegan al submit           | `FormFileInput` con `name="payment_proof_url"` pero schema usa `proof_url` | Alinear `name` con el schema: `"proof_url"`                         |
| tRPC rechaza el payload                | Se envía `proof_url: File[]` al insert                                     | Omitir `proof_url`; enviar solo `payment_proof_url: string[]`       |
| Pago creado sin comprobante tras error | Insert se ejecuta aunque falló upload                                      | `return` en el catch de `uploadFiles`                               |
| Validación Zod falla                   | `proof_url` definido como `z.url()` en el form                             | Usar `z.array(z.instanceof(File)).optional()`                       |
| Confusión de tipos                     | Mismo nombre en form y API                                                 | Mantener convención: `proof_url` (form) / `payment_proof_url` (API) |

---

## 15. Snippet mínimo para otro proyecto

### Validaciones

```ts
// Entity / insert
payment_proof_url: z.array(z.string()).default([]),

// Form
proof_url: z.array(z.instanceof(File)).optional(),
```

### Helpers

```ts
export const createFormSchema = vPayment.createForm();

export const defaultValues = {
  // ...campos del pago
  proof_url: [] as File[],
};
```

### Submit

```ts
let payment_proof_url: string[] = [];
if (data.proof_url?.length) {
  payment_proof_url = await uploadFiles({
    files: data.proof_url,
    folder: `payments/${clubId}/${userId}`,
    bucket: "proofs",
  });
}
const { proof_url: _, ...formData } = data;
await insertPayment.mutateAsync({ ...formData, payment_proof_url });
```

### JSX

```tsx
<FormFileInput
  name="proof_url"
  label="Comprobante de Pago"
  bucket="proofs"
  maxFiles={1}
  multiple={false}
  maxSize={1024 * 1024}
/>
```

---

## 16. Prompt para agente de IA (copiar/pegar)

```
Implementa comprobantes de pago siguiendo docs/PAYMENT_PROOF_URL_GUIDE.md:

CONVENCIÓN DE NOMBRES:
- Formulario: proof_url (File[], opcional)
- API/BD: payment_proof_url (string[])

VALIDACIÓN:
- Entity/insert: payment_proof_url = z.array(z.string()).default([])
- Form (createForm): proof_url = z.array(z.instanceof(File)).optional()
- defaultValues.proof_url = []

FORM:
- FormFileInput name="proof_url" (NO payment_proof_url)
- bucket="proofs", maxFiles según negocio

SUBMIT:
1. Si data.proof_url?.length → uploadFiles({ files, folder: `payments/${clubId}/${userId}`, bucket: 'proofs' })
2. Si falla upload → return (no insertar)
3. const { proof_url: _, ...formData } = data
4. insertPayment({ ...formData, payment_proof_url: string[] })

Adapta nombres de mutaciones, bucket y campos del pago a este proyecto.
```

---

## 17. Relación con otras guías

- **`docs/FORM_FILE_INPUT_LOGO_URL_GUIDE.md`**: patrón similar pero con `(string | File)[]` → una URL, subida post-insert con `entity.id`.
- **`docs/PAYMENT_PROOF_URL_GUIDE.md`** (este doc): `File[]` → `string[]`, nombres distintos form/API, subida pre-insert.
