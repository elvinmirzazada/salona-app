import { authAPI } from './api';

/**
 * Google Authentication Handler
 * Handles Google OAuth login and signup flows
 */
class GoogleAuth {
  /**
   * Initiate Google OAuth flow
   * Calls the authorization endpoint and redirects to Google
   */
  async authorize(): Promise<void> {
    try {
      const response = await authAPI.googleAuthorize();
      const data = response.data;

      if (data.authorization_url) {
        // Store state for verification if needed
        if (data.state) {
          // Store in sessionStorage for client-side access
          sessionStorage.setItem('google_auth_state', data.state);
        }

        // Redirect to Google authorization URL
        window.location.href = data.authorization_url;
      } else {
        throw new Error('No authorization URL received');
      }
    } catch (error) {
      console.error('Google authorization failed:', error);
      this.showError('Failed to initiate Google login. Please try again.');
    }
  }

  /**
   * Show error message to user
   */
  showError(message: string): void {
    // Check if there's an error display element
    const errorElement = document.getElementById('error-message') ||
      document.querySelector('.alert-danger');

    if (errorElement) {
      errorElement.textContent = message;
      (errorElement as HTMLElement).style.display = 'block';

      // Auto-hide after 5 seconds
      setTimeout(() => {
        (errorElement as HTMLElement).style.display = 'none';
      }, 5000);
    } else {
      alert(message);
    }
  }
}

// Export singleton instance
export const googleAuth = new GoogleAuth();

