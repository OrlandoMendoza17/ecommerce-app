export const getFullName = (profile?: Partial<Profile> | null) => {
  const name = profile?.full_name?.trim()
  return name || "Sin nombre"
}

/** Primer nombre + primer apellido (asume full_name: nombre(s) + apellido(s), p. ej. 4 palabras). */
export const getName = (profile?: Partial<Profile> | null) => {
  const fullName = profile?.full_name?.trim()
  if (!fullName) return "Sin nombre"

  const parts = fullName.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0]

  const firstName = parts[0]
  const firstLastName = parts.length >= 3 ? parts[2] : parts[1]
  return `${firstName} ${firstLastName}`
}

export const getAge = (profile?: Partial<Profile> | null) => {
  const dateOfBirth = profile?.date_of_birth
  if (!dateOfBirth) {
    return null
  }
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}
