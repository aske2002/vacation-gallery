export interface CredentialsResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// Placeholder hook - implement as needed
export function useAuth() {
  return {
    isAuthenticated: false,
    login: () => {},
    logout: () => {},
  };
}
