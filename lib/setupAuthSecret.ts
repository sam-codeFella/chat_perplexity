// This file helps ensure NextAuth has the proper secret set
// It should be imported early in your application's initialization

// Set up the necessary secret for NextAuth
export function setupAuthSecret() {
  // Log the current environment setup
  console.log('[Setup] Environment:', process.env.NODE_ENV);
  console.log('[Setup] AUTH_SECRET exists:', !!process.env.AUTH_SECRET);
  console.log('[Setup] NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET);
  
  // NextAuth.js uses NEXTAUTH_SECRET for JWT encryption/decryption
  // but our app has AUTH_SECRET defined
  if (process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
    console.log('[Setup] Setting NEXTAUTH_SECRET from AUTH_SECRET');
    process.env.NEXTAUTH_SECRET = process.env.AUTH_SECRET;
  }
  
  // Verify the setup after potential changes
  console.log('[Setup] NEXTAUTH_SECRET exists after setup:', !!process.env.NEXTAUTH_SECRET);
  
  // Return environment info for diagnostic purposes
  return {
    environment: process.env.NODE_ENV,
    auth_secret_exists: !!process.env.AUTH_SECRET,
    nextauth_secret_exists: !!process.env.NEXTAUTH_SECRET,
    auth_secret_length: process.env.AUTH_SECRET?.length,
    nextauth_secret_length: process.env.NEXTAUTH_SECRET?.length,
  };
}

// For immediate execution in environments that support it
if (typeof process !== 'undefined') {
  setupAuthSecret();
}

export default setupAuthSecret; 