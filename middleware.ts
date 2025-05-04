import NextAuth from 'next-auth';

import { authConfig } from '@/app/(auth)/auth.config';
import { setupAuthSecret } from '@/lib/setupAuthSecret';

// Make sure secrets are properly set up
const secretInfo = setupAuthSecret();

// Log environment details
console.log('[Middleware] Environment:', process.env.NODE_ENV);
console.log('[Middleware] AUTH_SECRET exists:', !!process.env.AUTH_SECRET);
console.log('[Middleware] NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET);
console.log('[Middleware] AUTH_SECRET length:', process.env.AUTH_SECRET?.length);
console.log('[Middleware] Secret Setup Info:', secretInfo);

export default NextAuth(authConfig).auth;

export const config = {
  matcher: ['/', '/:id', '/api/:path*', '/login', '/register'],
};
