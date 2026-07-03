import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import type { ReactNode } from 'react';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuthStore();
  if (!user || !['ADMIN', 'SUPER_ADMIN', 'PHARMACIST'].includes(user.role)) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
