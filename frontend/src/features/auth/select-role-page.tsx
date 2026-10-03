import { Navbar } from '../../components/ui/navbar/navbar'
import { AuthLayout } from './components/auth-layout'
import { RoleSelection } from './components/role-selection'

export function SelectRolePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-relaive-cream to-relaive-surface">
      <Navbar />
      <AuthLayout>
        <RoleSelection />
      </AuthLayout>
    </div>
  )
}
