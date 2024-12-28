import { create } from "zustand";
import { ROLE_PERMISSIONS } from "../config/permissionsConfig";
import useAuthStore from "./store";

const usePermissionsStore = create(() => ({
  /**
   * Checks if the user has a specific permission for a resource.
   *
   * @param {string} resource - The name of the resource (e.g., "devices", "admin").
   * @param {string} permission - The type of permission (e.g., "read", "create").
   * @returns {boolean} - Returns `true` if the user has the specified permission.
   */
  hasPermission: (resource, permission) => {
    try {
      const { roles } = useAuthStore.getState();

      // If no roles are assigned to the user, deny access
      if (!roles || roles.length === 0) {
        console.warn('No roles assigned to user');
        return false;
      }

      // Check if any of the user's roles have the specified permission for the resource
      return roles.some((role) => {
        const rolePermissions = ROLE_PERMISSIONS[role];
        if (!rolePermissions) {
          console.warn(`No permissions defined for role: ${role}`);
          return false;
        }

        // Get permissions for the specific resource
        const permissions = rolePermissions[resource];
        if (!permissions) {
          return false; // Don't warn here as it's a normal case
        }

        return permissions.includes(permission);
      });
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  },

  /**
   * Check if user has any permission of a specific type across all roles and resources
   * @param {string} permission - The permission to check for
   * @returns {boolean} - True if user has the permission in any role/resource
   */
  hasAnyPermission: (permission) => {
    try {
      const { roles } = useAuthStore.getState();

      if (!roles || roles.length === 0) return false;

      return roles.some(role => {
        const rolePerms = ROLE_PERMISSIONS[role];
        if (!rolePerms) return false;

        // Check all resources in this role
        return Object.values(rolePerms).some(resourcePerms => 
          resourcePerms.includes(permission)
        );
      });
    } catch (error) {
      console.error('Error checking any permission:', error);
      return false;
    }
  },

  // Helper functions for common permission checks
  canRead: (resource) => usePermissionsStore.getState().hasPermission(resource, "read"),
  canCreate: (resource) => usePermissionsStore.getState().hasPermission(resource, "create"),
  canUpdate: (resource) => usePermissionsStore.getState().hasPermission(resource, "update"),
  canDelete: (resource) => usePermissionsStore.getState().hasPermission(resource, "delete"),
  canApprove: (resource) => usePermissionsStore.getState().hasPermission(resource, "approve"),
  canExport: (resource) => usePermissionsStore.getState().hasPermission(resource, "export"),
}));

export default usePermissionsStore;