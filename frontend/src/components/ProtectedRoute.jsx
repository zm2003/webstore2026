import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function ProtectedRoute({ children, requiredRole, requiredRoles }) {
    const { user } = useAuth();
    const location = useLocation();

    if (!user) {
        // Not logged in, redirect to login page with the return url
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const rolesToCheck = requiredRoles || (requiredRole ? [requiredRole] : null);

    if (rolesToCheck && !rolesToCheck.includes(user.role)) {
        // Logged in but wrong role, redirect to home page
        return <Navigate to="/home" replace />;
    }

    return children;
}
