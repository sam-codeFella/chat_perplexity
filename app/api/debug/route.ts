import { NextResponse } from 'next/server';
import { setupAuthSecret } from '@/lib/setupAuthSecret';

// This endpoint provides diagnostic information about the environment
// but does not expose actual secret values
export async function GET() {
  // Run the setup utility to ensure NEXTAUTH_SECRET is set
  const setupInfo = setupAuthSecret();
  
  // Log environment info for server logs
  console.log('[Debug API] Environment:', process.env.NODE_ENV);
  console.log('[Debug API] AUTH_SECRET exists:', !!process.env.AUTH_SECRET);
  console.log('[Debug API] AUTH_SECRET length:', process.env.AUTH_SECRET?.length);
  console.log('[Debug API] NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET);
  console.log('[Debug API] NEXTAUTH_SECRET length:', process.env.NEXTAUTH_SECRET?.length);
  console.log('[Debug API] Setup Info:', setupInfo);
  
  // Get the first few characters of secrets (for safe comparison)
  const authSecretPrefix = process.env.AUTH_SECRET 
    ? `${process.env.AUTH_SECRET.substring(0, 3)}...` 
    : 'not set';
  
  const nextAuthSecretPrefix = process.env.NEXTAUTH_SECRET 
    ? `${process.env.NEXTAUTH_SECRET.substring(0, 3)}...` 
    : 'not set';

  // Collect all relevant environment variables
  const environmentVariables: Record<string, string> = {};
  for (const key in process.env) {
    // Only include non-sensitive vars or status of sensitive ones
    if (key.includes('SECRET') || key.includes('KEY') || key.includes('PASSWORD') || key.includes('TOKEN')) {
      environmentVariables[key] = `[exists: ${!!process.env[key]}, length: ${process.env[key]?.length || 0}]`;
    } else if (!key.includes('AWS') && !key.includes('PRIVATE')) {
      // Include value for non-sensitive vars
      environmentVariables[key] = process.env[key] as string;
    }
  }

  // Return environment info (but not the actual secrets)
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    auth_secret_exists: !!process.env.AUTH_SECRET,
    auth_secret_length: process.env.AUTH_SECRET?.length,
    auth_secret_prefix: authSecretPrefix,
    nextauth_secret_exists: !!process.env.NEXTAUTH_SECRET,
    nextauth_secret_length: process.env.NEXTAUTH_SECRET?.length,
    nextauth_secret_prefix: nextAuthSecretPrefix,
    // Include information about JWT secrets that might be used
    secrets_match: process.env.AUTH_SECRET === process.env.NEXTAUTH_SECRET,
    // Check if we have environment variables set
    has_server_env_vars: !!process.env.VERCEL,
    is_vercel: !!process.env.VERCEL,
    vercel_env: process.env.VERCEL_ENV,
    region: process.env.VERCEL_REGION,
    // Add a summary of environment variables
    env_vars: environmentVariables,
    // Add setup info
    setup_info: setupInfo
  });
} 