/**
 * Authentication utility functions
 */

/**
 * Get the current user from localStorage
 * @returns {Object|null} User object or null if not logged in
 */
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
    return null;
  }
};

/**
 * Get the current user's role
 * @returns {string} User role (admin, member, viewer) or empty string if not logged in
 */
export const getUserRole = () => {
  const user = getCurrentUser();
  return user?.role || '';
};

/**
 * Check if the current user is an admin
 * @returns {boolean} True if user is admin
 */
export const isAdmin = () => {
  return getUserRole() === 'admin';
};

/**
 * Check if the current user is a member or higher
 * @returns {boolean} True if user is member or admin
 */
export const isMember = () => {
  const role = getUserRole();
  return role === 'admin' || role === 'member';
};

/**
 * Check if the current user is a viewer or higher (any authenticated user)
 * @returns {boolean} True if user is viewer, member, or admin
 */
export const isViewer = () => {
  const role = getUserRole();
  return role === 'admin' || role === 'member' || role === 'viewer';
};

/**
 * Check if the current user has a specific role
 * @param {string} requiredRole - The role to check for
 * @returns {boolean} True if user has the required role or higher
 */
export const hasRole = (requiredRole) => {
  const roleHierarchy = {
    admin: 3,
    member: 2,
    viewer: 1
  };
  
  const userRole = getUserRole();
  const userLevel = roleHierarchy[userRole] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;
  
  return userLevel >= requiredLevel;
};
