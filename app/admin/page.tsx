import { redirect } from 'next/navigation'

export default function AdminPage() {
  // Redirect to the new admin dashboard location
  redirect('/dashboard/admin')
}