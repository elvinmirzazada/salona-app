/**
 * Shared auth helper — single source of truth for logout + cache clearing.
 * Imported by both api.ts (axios interceptor) and fetchWithAuth.ts.
 */
import { API_BASE_URL } from '../config/api';

interface ClearAuthOptions {
  skipServerCall?: boolean;
}

export const clearAuthAndLogout = async ({ skipServerCall = false }: ClearAuthOptions = {}): Promise<void> => {
  try {
    if (!skipServerCall) {
      await fetch(`${API_BASE_URL}/v1/users/auth/logout`, {
        method: 'PUT',
        credentials: 'include',
      }).catch(() => {
        // Ignore logout API errors — we just want the cookies cleared
      });
    }
  } catch {
    // Ignore
  } finally {
    localStorage.clear();
    sessionStorage.clear();

    if (
      window.location.pathname !== '/login' &&
      window.location.pathname !== '/signup' &&
      !window.location.pathname.startsWith('/booking/')
    ) {
      window.location.href = '/login';
    }
  }
};
