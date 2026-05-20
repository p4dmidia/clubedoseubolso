import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: string;
    allowedRoles?: string[];
    requireActiveSubscription?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles, requireActiveSubscription }) => {
    const { user, profile, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2980B9]"></div>
            </div>
        );
    }

    if (!user || !profile) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (allowedRoles && allowedRoles.length > 0) {
        if (!allowedRoles.includes(profile.role)) {
            // Se tentar acessar o admin sem ser admin, joga pra home/login
            if (profile.role === 'admin_master' || profile.role === 'admin_op') {
                return <Navigate to="/admin/dashboard" replace />;
            } else if (profile.role === 'affiliate') {
                return <Navigate to="/afiliado/dashboard" replace />;
            } else {
                return <Navigate to="/cliente/compras" replace />;
            }
        }
    }

    if (requireActiveSubscription) {
        if (profile.subscription_status === 'inadimplente') {
            // Redireciona o afiliado inadimplente para tela de pagamento/renovação
            return <Navigate to="/plan/renovacao" replace />;
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;
