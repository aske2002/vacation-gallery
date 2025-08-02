import { ProtectedRoute } from '@/components/auth/protected-route'
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/admin')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <ProtectedRoute>
        <Outlet />
    </ProtectedRoute>
  )
}
