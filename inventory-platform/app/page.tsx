import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OrderingPage from '@/components/OrderingPage'
import ManagerDashboard from '@/components/ManagerDashboard'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, clinic')
    .eq('id', user.id)
    .single()

  const isManager = profile?.role === 'manager'

  return (
    <div className="min-h-screen bg-gray-50">
      {isManager ? <ManagerDashboard /> : <OrderingPage />}
    </div>
  )
}

