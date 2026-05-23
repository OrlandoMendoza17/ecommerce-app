import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale/es"

export const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export const formatDateToNow = (dateString: string) => {
  try {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: es
    })
  } catch {
    return dateString
  }
}