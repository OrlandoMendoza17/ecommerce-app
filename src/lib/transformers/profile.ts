export const getFullName = (profile?: Partial<Profile> | null) => {
  const name = profile?.full_name?.trim()
  return name || "Sin nombre"
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
