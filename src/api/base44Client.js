import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "693936c5006b2d1f583a2e5d", 
  requiresAuth: true // Ensure authentication is required for all operations
});
