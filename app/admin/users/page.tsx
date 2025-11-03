import { redirect } from 'next/navigation'

export default function AdminUsersPage() {
  // Redirect to the new admin dashboard location
  redirect('/dashboard/admin')
}
