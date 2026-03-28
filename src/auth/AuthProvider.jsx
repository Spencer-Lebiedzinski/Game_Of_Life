import { Auth0Provider } from '@auth0/auth0-react';

// Hardcoded as fallback since SPA client IDs are public (no secret used)
const domain = import.meta.env.VITE_AUTH0_DOMAIN || 'dev-cz8usjfuuxo17sfo.us.auth0.com';
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID || 'dNbKb2pu463NFJRXi1Tny11ajo9eojxT';

export default function AuthProvider({ children }) {
  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{ redirect_uri: window.location.origin }}
    >
      {children}
    </Auth0Provider>
  );
}
