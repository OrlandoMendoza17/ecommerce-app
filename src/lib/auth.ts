import { createClient } from '@/utils/supabase/supabase.client'
import { RegisterForm } from '@/components/pages/auth/RegisterForm/RegisterForm.types'

const appUrl = process.env.NEXT_PUBLIC_APP_URL

const getAuthAPI = () => {
  const supabase = createClient()

  const login = async (credentials: { email: string, password: string }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  const signup = async (userData: RegisterForm) => {
    const { email, password, full_name, phone } = userData
    const emailRedirectTo = `${appUrl}/auth/login`
    const options = {
      emailRedirectTo,
      data: { full_name, phone },
    }

    const user = { email, password, options }
    const { data, error } = await supabase.auth.signUp(user)

    if (error) {
      throw new Error(error.message)
    };

    const userId = data.user?.id as string;

    const newProfile = { id: userId, email, full_name, phone };
    return newProfile;
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw new Error(error.message)
    }
  }

  const resetPasswordForEmail = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/auth/reset-password`
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  /** Envía un enlace mágico al email para iniciar sesión sin contraseña. */
  const signInWithOtp = async (email: string) => {
    const emailRedirectTo = `${appUrl}/user`
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo,
      },
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  const updateEmail = async (email: string) => {
    // Obtener el usuario actual para preservar la metadata existente
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('User not found')
    }

    // Actualizar el email y también actualizar el email en la metadata
    const currentMetadata = user.user_metadata || {}
    const data = { ...currentMetadata, email }

    const { error } = await supabase.auth.updateUser({ email, data })

    if (error) {
      throw new Error(error.message)
    }
  }

  const updateMetadata = async (metadata: Record<string, any>) => {
    // Obtener el usuario actual para preservar la metadata existente
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('User not found')
    }

    // Preservar la metadata existente y actualizar con los nuevos valores
    const currentMetadata = user.user_metadata || {}
    const { error } = await supabase.auth.updateUser({
      data: {
        ...currentMetadata,
        ...metadata
      }
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  return {
    signup,
    login,
    logout,
    updateEmail,
    updatePassword,
    updateMetadata,
    resetPasswordForEmail,
    signInWithOtp,
  }
}

export const authAPI = getAuthAPI()
