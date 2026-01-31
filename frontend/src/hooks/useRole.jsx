/**
 * Role-Based Access Control Hook
 * Provides role checks and permission enforcement for UI/UX
 */

import { useContext, useCallback } from 'react';

// Role context (to be wrapped around app)
import React from 'react';
const RoleContext = React.createContext(null);

export const RoleProvider = ({ children, user }) => {
  return (
    <RoleContext.Provider value={user}>
      {children}
    </RoleContext.Provider>
  );
};

/**
 * useRole hook - Check user role and permissions
 */
export const useRole = () => {
  const user = useContext(RoleContext);

  const hasRole = useCallback((role) => {
    if (!user) return false;
    if (user.role === role) return true;
    
    // Role hierarchy: admin > member > viewer
    const hierarchy = { admin: 3, member: 2, viewer: 1 };
    return (hierarchy[user.role] || 0) >= (hierarchy[role] || 0);
  }, [user]);

  const canPerform = useCallback((action) => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(action);
  }, [user]);

  const getPermissions = useCallback(() => {
    return user?.permissions || [];
  }, [user]);

  const isAdmin = useCallback(() => hasRole('admin'), [hasRole]);
  const isMember = useCallback(() => hasRole('member'), [hasRole]);
  const isViewer = useCallback(() => hasRole('viewer'), [hasRole]);

  const getRole = useCallback(() => user?.role || null, [user]);

  return {
    user,
    hasRole,
    canPerform,
    getPermissions,
    isAdmin,
    isMember,
    isViewer,
    getRole
  };
};

/**
 * Protected UI component - Only renders if user has permission
 * @param {string} requires - Permission required (e.g., 'create_ticket')
 * @param {ReactNode} children - Content to show if allowed
 * @param {ReactNode} fallback - Fallback UI if not allowed
 * @param {string} requireRole - Role required instead of permission
 */
export const ProtectedFeature = ({ 
  requires, 
  children, 
  fallback = null,
  requireRole = null 
}) => {
  const { canPerform, hasRole } = useRole();

  const isAllowed = requireRole 
    ? hasRole(requireRole)
    : requires 
      ? canPerform(requires)
      : true;

  return isAllowed ? children : fallback;
};

/**
 * Role Badge - Display user's current role
 */
export const RoleBadge = ({ variant = 'filled' }) => {
  const { getRole } = useRole();
  const role = getRole();

  const roleColors = {
    admin: { bgcolor: '#d32f2f', color: '#fff' },
    member: { bgcolor: '#1976d2', color: '#fff' },
    viewer: { bgcolor: '#f57c00', color: '#fff' }
  };

  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '0.75rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      ...roleColors[role]
    }}>
      {role}
    </span>
  );
};

/**
 * Permission Matrix - Understand what each role can do
 * For debugging and testing
 */
export const getPermissionMatrix = () => {
  return {
    admin: {
      boards: ['create', 'read', 'update', 'delete', 'manage'],
      tickets: ['create', 'read', 'update', 'delete', 'assign'],
      comments: ['create', 'read', 'update', 'delete'],
      columns: ['create', 'read', 'update', 'delete'],
      users: ['create', 'read', 'update', 'delete']
    },
    member: {
      boards: ['create', 'read', 'update'],
      tickets: ['create', 'read', 'update', 'assign'],
      comments: ['create', 'read', 'update'],
      columns: ['read'],
      users: []
    },
    viewer: {
      boards: ['read'],
      tickets: ['read'],
      comments: ['read'],
      columns: ['read'],
      users: []
    }
  };
};
