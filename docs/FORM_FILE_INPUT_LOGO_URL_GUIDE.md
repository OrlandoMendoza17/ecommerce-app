# Guía: campo `logo_url` con `FormFileInput`

Guía portable para implementar subida de logo en formularios (patrón de referencia: `TeamForm`). Pensada para copiar en otro proyecto o pasarla a un agente de IA.

## Referencia en este repositorio

| Archivo | Descripción |
|---------|-------------|
| `src/components/form/FormFileInput/FormFileInput.tsx` | Componente dropzone |
| `src/components/form/FormFileInput/FormFileInput.types.ts` | Props del componente |
| `src/components/pages/admin/teams/TeamForm/TeamForm.tsx` | Implementación de referencia |
| `src/components/pages/admin/teams/TeamForm/TeamForm.helpers.ts` | Schema Zod del formulario |
| `src/components/pages/admin/teams/TeamForm/TeamForm.types.ts` | Tipos del formulario |
| `src/validations/teams.validations.ts` | Validación entidad / tRPC |
| `src/utils/supabase/storage/uploadFiles.ts` | Subida a Storage |
| `src/utils/supabase/storage/downloadFiles.ts` | Descarga para precarga en edición |

---

## 1. Concepto

| Capa | Tipo de `logo_url` |
|------|-------------------|
| Base de datos / API (tRPC) | `string` (URL o `''`) |
| Formulario (react-hook-form) | `(string \| File)[]` |
| Al enviar (`onSubmit`) | Se convierte a **una** URL `string` |

### Flujos

**Crear (create):**

1. `insert` de la entidad con `logo_url: ''` (o sin logo).
2. Obtener `id` del registro creado.
3. `uploadFiles` → carpeta `{bucket}/{id}/`.
4. `update` con `logo_url: uploadedUrl`.

**Editar (update):**

- Si hay `File` nuevo → subir y usar la nueva URL.
- Si solo hay `string` en el array → mantener URL existente.
- Si el array está vacío → `logo_url: ''`.

---

## 2. Dependencias

- `react-hook-form` + `@hookform/resolvers/zod`
- `react-dropzone` (usado internamente por `FormFileInput`)
- `<Form {...form}>` que envuelva el formulario (`FormProvider` / `useFormContext`)
- Utilidades de storage: `uploadFiles`, opcionalmente `downloadFiles` para edición
- Bucket en Supabase Storage (ej. `teams_logo`)

---

## 3. Validación en dos capas

### 3.1 Entidad / API — `teams.validations.ts`

En el schema de entidad, `logo_url` es siempre **string (URL o vacío)**:

```ts
// teamValidation() — schema base
logo_url: z.url({
  message: 'Invalid URL format'
}).or(z.literal('')),
```

`vTeam.form()` hereda ese campo como URL (antes de override en helpers):

```ts
const formValidation = () => {
  const teamSchema = teamValidation()
  return teamSchema.omit({
    id: true,
    club_id: true,
    created_by: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
  })
}
```

**Insert (tRPC):** `logo_url` opcional, misma regla:

```ts
logo_url: z.url({ message: 'Invalid URL format' }).or(z.literal('')).optional(),
```

**Update (tRPC):** schema parcial del entity; si se envía `logo_url`, debe ser URL válida o `''`.

> Las mutaciones `insert` / `update` **nunca** reciben `File`.

### 3.2 Formulario UI — `TeamForm.helpers.ts`

El formulario **omite** `logo_url` del schema de entidad y lo redefine como array mixto:

```ts
import { z } from "zod"
import { vTeam } from "@/validations/teams.validations"

const baseFormSchema = vTeam.form().omit({ logo_url: true })

export const schema = baseFormSchema.extend({
  logo_url: z.array(z.union([z.string(), z.instanceof(File)])).min(0),
})

export type TeamFormDefaults = z.infer<typeof schema>

export const defaultValues: TeamFormDefaults = {
  sport_id: '',
  name: '',
  currency: 'USD',
  monthly_fee: 0,
  description: '',
  logo_url: [],              // create: sin logo
  status: 'active' as const,
}
```

| Valor en el array | Significado |
|-------------------|-------------|
| `[]` | Sin logo |
| `['https://...']` | URL existente (modo edición) |
| `[File]` | Archivo nuevo pendiente de subir |

---

## 4. Tipos del formulario — `TeamForm.types.ts`

```ts
import { z } from "zod"
import { schema } from "./TeamForm.helpers"

export type TeamForm = z.infer<typeof schema>

export type TeamFormProps = {
  team?: Team   // entidad existente en modo edición
}
```

---

## 5. Inicialización del estado — `TeamForm.tsx`

```tsx
const form = useForm<TeamForm>({
  resolver: zodResolver(teamFormSchema),
  defaultValues: {
    ...defaultValues,
    ...team,
    // SIEMPRE al final: normalizar string → array
    logo_url: team?.logo_url ? [team.logo_url] : [],
  },
})
```

### Orden del spread (crítico)

1. `...defaultValues` — incluye `logo_url: []`.
2. `...team` — en edición rellena campos; si `team.logo_url` es string, lo sobrescribe incorrectamente.
3. `logo_url: team?.logo_url ? [team.logo_url] : []` — **corrección obligatoria al final**.

### Escenarios

| Modo | `team` | `logo_url` inicial |
|------|--------|-------------------|
| Crear | `undefined` | `[]` |
| Editar sin logo | `{ logo_url: '' }` | `[]` |
| Editar con logo | `{ logo_url: 'https://...' }` | `['https://...']` |

### Snippet genérico

```tsx
const form = useForm<EntityForm>({
  resolver: zodResolver(entityFormSchema),
  defaultValues: {
    ...defaultValues,
    ...entity,
    logo_url: entity?.logo_url ? [entity.logo_url] : [],
  },
})

const isEditMode = !!entity
```

---

## 6. Constante del bucket

```ts
const TEAMS_LOGO_BUCKET = "teams_logo"
```

Ruta de subida: `{bucket}/{entityId}/0.{ext}` (ver `uploadFiles.ts`).

---

## 7. JSX — `FormFileInput`

Debe estar **dentro** de `<Form {...form}>` (usa `useFormContext`).

```tsx
import FormFileInput from "@/components/form/FormFileInput/FormFileInput"
import FormSection from "@/components/form/FormSection/FormSection"

<FormSection title="Logo" description="Configuración del logo del equipo">
  <FormFileInput
    name="logo_url"
    label="Logo del equipo"
    description="Sube una imagen (JPG, PNG, GIF, WEBP). Máximo 1MB"
    folder={team?.id}                    // solo en edición
    bucket={TEAMS_LOGO_BUCKET}
    multiple={false}
    maxFiles={1}
    maxSize={1024 * 1024}
    accept={{ 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] }}
    handleDrop={(acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setValue("logo_url", [acceptedFiles[0]])
      }
    }}
  />
</FormSection>
```

### Props de `FormFileInput`

| Prop | Requerido | Descripción |
|------|-----------|-------------|
| `name` | Sí | Campo RHF, ej. `"logo_url"` |
| `bucket` | Sí | Nombre del bucket en Storage |
| `label` | Sí | Etiqueta visible |
| `folder` | No | ID de entidad en **edición**; precarga archivos con `downloadFiles` |
| `handleDrop` | Recomendado | Control manual del valor (logo único) |
| `multiple` | No | `false` para un solo archivo |
| `maxFiles` | No | `1` para logo |
| `maxSize` | No | Bytes, ej. `1024 * 1024` (1 MB) |
| `accept` | No | MIME/extensiones permitidas |
| `description` | No | Texto de ayuda |
| `disabled` | No | Deshabilitar dropzone |

**Comportamiento de `folder`:** si está definido, al montar el componente lista y descarga archivos del bucket y los pone en el campo. En **create** no hay `id` → no pasar `folder` o usar `undefined`.

---

## 8. Lógica de `onSubmit`

```tsx
import { uploadFiles } from "@/utils/supabase/storage/uploadFiles"

const TEAMS_LOGO_BUCKET = "teams_logo"

const onSubmit = handleSubmit(async (data: TeamForm) => {
  setLoading(true)
  try {
    // 1) Separar URLs existentes vs archivos nuevos
    const existingUrls: string[] = data.logo_url.filter(
      (item): item is string => typeof item === "string"
    )
    const newFiles: File[] = data.logo_url.filter(
      (item): item is File => item instanceof File
    )

    let finalLogoUrl = ""

    // 2) Edición: subir solo si hay File nuevo
    if (newFiles.length > 0 && isEditMode && team) {
      const uploadedUrls = await uploadFiles({
        files: newFiles,
        folder: team.id,
        bucket: TEAMS_LOGO_BUCKET,
      })
      if (uploadedUrls.length > 0) finalLogoUrl = uploadedUrls[0]
    } else if (existingUrls.length > 0) {
      finalLogoUrl = existingUrls[0]
    }

    const payload = {
      name: data.name,
      description: data.description,
      sport_id: data.sport_id,
      status: data.status,
      monthly_fee: data.monthly_fee,
      currency: data.currency,
      logo_url: finalLogoUrl, // string para API/DB
    }

    if (isEditMode && team) {
      await updateTeam({ ...payload, id: team.id, club_id: team.club_id })
      router.push("/admin/teams")
    } else {
      invariant(club_id, "Club ID is required")

      // 3) Create: insert sin logo (o con '')
      const createdTeam = await insertTeam({ ...payload, club_id })

      // 4) Create: subir logo después de tener id
      if (newFiles.length > 0 && createdTeam.id) {
        const uploadedUrls = await uploadFiles({
          files: newFiles,
          folder: createdTeam.id,
          bucket: TEAMS_LOGO_BUCKET,
        })
        if (uploadedUrls.length > 0) {
          await updateTeam({
            id: createdTeam.id,
            club_id,
            logo_url: uploadedUrls[0],
          })
        }
      }

      router.push("/admin/teams")
    }
  } catch (error) {
    onError(error as Error)
  } finally {
    setLoading(false)
  }
})
```

### Reglas del submit

1. **Nunca** enviar `File[]` al API; siempre `finalLogoUrl: string`.
2. **Create + archivo:** `insert` → `uploadFiles` → `update` con URL.
3. **Edit + sin cambio:** `existingUrls[0]` conserva la URL.
4. **Edit + imagen nueva:** `uploadFiles` con `folder: team.id`.
5. **Sin imagen:** `finalLogoUrl = ''`.

---

## 9. Utilidad `uploadFiles`

```ts
interface UploadFilesParams {
  files: File[]
  folder: string   // id de la entidad
  bucket: string
}

// Retorna: Promise<string[]>
// Ruta: {bucket}/{folder}/0.{ext}
```

Implementación: `src/utils/supabase/storage/uploadFiles.ts`.

---

## 10. Diagrama del flujo

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────┐
│  FormFileInput  │────▶│ logo_url: (string|   │────▶│  onSubmit   │
│  (dropzone)     │     │ File)[]              │     │  → string   │
└─────────────────┘     └──────────────────────┘     └──────┬──────┘
                                                              │
                    ┌─────────────────────────────────────────┘
                    ▼
         ┌──────────────────────┐
         │  tRPC insert/update  │
         │  logo_url: z.url()   │
         └──────────┬───────────┘
                    ▼
         ┌──────────────────────┐
         │  DB: logo_url TEXT     │
         └──────────────────────┘
```

---

## 11. Checklist de implementación

- [ ] `teams.validations.ts`: `logo_url` como `z.url().or(z.literal(''))` en entity/insert/update
- [ ] `*.helpers.ts`: `omit({ logo_url })` + `extend` con array `(string | File)[]`
- [ ] `defaultValues.logo_url = []`
- [ ] `useForm` con `logo_url: entity?.logo_url ? [entity.logo_url] : []` **al final** del spread
- [ ] `FormFileInput` dentro de `<Form {...form}>`
- [ ] `handleDrop` → `setValue("logo_url", [file])` para logo único
- [ ] `folder={entity?.id}` solo en edición
- [ ] Bucket configurado en Supabase
- [ ] `onSubmit`: filtrar strings/Files, calcular `finalLogoUrl`
- [ ] Create: upload **después** del `insert` cuando exista `id`

---

## 12. Errores frecuentes

| Problema | Causa | Solución |
|----------|--------|----------|
| `useFormContext` undefined | `FormFileInput` fuera de `<Form>` | Envolver con `<Form {...form}>` |
| Validación Zod falla en submit | `logo_url` sigue siendo `z.url()` en el form schema | Override en `*.helpers.ts` |
| Logo no se guarda en create | Subir antes de tener `id` | `insert` → `upload` → `update` |
| En edición `logo_url` es string en RHF | `...team` sin normalizar al final | Línea `logo_url: team?.logo_url ? [...] : []` al final |
| Varios archivos en el campo | Sin `handleDrop` / `maxFiles` | `handleDrop` + `maxFiles={1}` + `multiple={false}` |
| Precarga falla en create | `folder` sin id válido | `folder={team?.id}` solo si existe |

---

## 13. Otro ejemplo en el repo: `ClubForm`

Mismo patrón en:

- `src/components/pages/admin/clubs/ClubForm/ClubForm.tsx`
- `src/components/pages/admin/clubs/ClubForm/ClubForm.helpers.ts`
- Bucket: `clubs_logo`

---

## 14. Prompt para agente de IA (copiar/pegar)

```
Implementa el campo logo_url en [NombreForm] siguiendo docs/FORM_FILE_INPUT_LOGO_URL_GUIDE.md:

1. Validación entidad: logo_url = z.url().or(z.literal('')) en *.validations.ts
2. Validación form (*.helpers.ts):
   - baseFormSchema = vX.form().omit({ logo_url: true })
   - extend: logo_url = z.array(z.union([z.string(), z.instanceof(File)])).min(0)
   - defaultValues.logo_url = []
3. useForm:
   defaultValues: { ...defaultValues, ...entity, logo_url: entity?.logo_url ? [entity.logo_url] : [] }
4. FormFileInput: bucket, folder solo en edición, maxFiles=1, handleDrop con setValue
5. onSubmit: separar existingUrls/newFiles → finalLogoUrl string
6. Create: insert → uploadFiles(folder: created.id) → update con URL

Adapta nombres de mutaciones, bucket y rutas a este proyecto.
Si no existe FormFileInput, portar también uploadFiles/downloadFiles.
```
