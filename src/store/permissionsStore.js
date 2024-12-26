import { create } from "zustand"; // Import the Zustand library for state management
import { ROLE_PERMISSIONS } from "../config/permissionsConfig"; // Import role-based permissions configuration
import useAuthStore from "./store"; // Import the auth store to access user roles and authentication data

// Define the permissions store using Zustand
const usePermissionsStore = create(() => ({
  /**
   * Checks if the user has a specific permission for a resource.
   *
   * @param {string} resource - The name of the resource (e.g., "devices").
   * @param {string} permission - The type of permission (e.g., "read", "create").
   * @returns {boolean} - Returns `true` if the user has the specified permission, otherwise `false`.
   */
  hasPermission: (resource, permission) => {
    const { roles } = useAuthStore.getState(); // Access user roles from the auth store

    // If no roles are assigned to the user, deny access
    if (!roles || roles.length === 0) return false;

    // Check if any of the user's roles have the specified permission for the resource
    return roles.some((role) => {
      const permissions = ROLE_PERMISSIONS[role]?.[resource] || []; // Get permissions for the role and resource
      return permissions.includes(permission); // Check if the permission exists
    });
  },

  /**
   * Permission-specific helper functions
   *
   * These functions provide an easier way to check for specific permissions without passing
   * the permission type explicitly. For example, `canRead` checks for "read" permissions.
   */

  // Checks if the user has "read" permission for the given resource
  canRead: (resource) =>
    usePermissionsStore.getState().hasPermission(resource, "read"),

  // Checks if the user has "create" permission for the given resource
  canCreate: (resource) =>
    usePermissionsStore.getState().hasPermission(resource, "create"),

  // Checks if the user has "update" permission for the given resource
  canUpdate: (resource) =>
    usePermissionsStore.getState().hasPermission(resource, "update"),

  // Checks if the user has "delete" permission for the given resource
  canDelete: (resource) =>
    usePermissionsStore.getState().hasPermission(resource, "delete"),
}));

export default usePermissionsStore; // Export the permissions store for use across the app
