'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/server'

export async function signUp(email: string, password: string, fullName: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function signIn(email: string, password: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard')
}

export async function updateProfile(formData: FormData) {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()
  
  const updates = {
    full_name: formData.get('fullName') as string,
    username: formData.get('username') as string,
    bio: formData.get('bio') as string,
    avatar_url: formData.get('avatarUrl') as string,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/profile')
  revalidatePath('/dashboard')
}

export async function deleteAccount() {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()
  
  // First, delete user data from your tables
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', user.id)

  if (profileError) {
    throw new Error(profileError.message)
  }

  // Then delete the auth user
  const { error: authError } = await supabase.auth.admin.deleteUser(user.id)

  if (authError) {
    throw new Error(authError.message)
  }

  redirect('/')
}

export async function changeEmail(currentPassword: string, newEmail: string) {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()
  
  // Verify current password first
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  })

  if (signInError) {
    throw new Error('Current password is incorrect')
  }

  // Update email
  const { error: updateError } = await supabase.auth.updateUser({
    email: newEmail,
  })

  if (updateError) {
    throw new Error(updateError.message)
  }

  revalidatePath('/settings')
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()
  
  // Verify current password first
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  })

  if (signInError) {
    throw new Error('Current password is incorrect')
  }

  // Update password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (updateError) {
    throw new Error(updateError.message)
  }

  revalidatePath('/settings')
}