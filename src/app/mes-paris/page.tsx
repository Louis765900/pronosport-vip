import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import MesParisClient from '@/components/mes-paris/MesParisClient'

export const dynamic = 'force-dynamic'

export default function MesParisPage() {
  const cookieStore = cookies()
  const session = cookieStore.get('vip_session')?.value
  const userRole = cookieStore.get('user_role')?.value
  const userEmail = cookieStore.get('user_email')?.value

  // Rediriger si non connecte
  if (!session) {
    redirect('/login?redirect=/mes-paris')
  }

  // Seuls les VIP et admin peuvent acceder
  if (userRole !== 'vip' && userRole !== 'admin') {
    redirect('/vip')
  }

  return <MesParisClient userEmail={userEmail || ''} />
}
