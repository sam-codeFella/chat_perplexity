import { compare } from 'bcrypt-ts';
import NextAuth, { type User as NextAuthUser, type Session } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { getUser } from '@/lib/db/queries';

import { authConfig } from './auth.config';

// Log authentication environment details
console.log('[Auth] Environment:', process.env.NODE_ENV);
console.log('[Auth] AUTH_SECRET exists:', !!process.env.AUTH_SECRET);
console.log('[Auth] NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET);
console.log('[Auth] AUTH_SECRET length:', process.env.AUTH_SECRET?.length);

interface ExtendedSession extends Session {
  user: User & {
    token?: string;
  };
}

// Extend the base User type to include token
interface User extends NextAuthUser {
  token?: string;
}

//okay this is well understood now.

/*
Credentials Provider
The Credentials provider handles username/password authentication:
Callbacks
Two callback functions are defined:
JWT Callback: Runs when a JWT is created/updated -> why are these callbacks needed? 
Session Callback: Runs when a session is created/updated -> why are these callbacks needed?   
*/
export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
        token: { type: 'text' }, // Add token to credentials
      },
      async authorize({ email, password, token }: any) {
        console.log('[Auth] Attempting to authorize user:', email);
        try {
          const users = await getUser(email);
          if (users.length === 0) {
            console.log('[Auth] User not found:', email);
            return null;
          }
          const passwordsMatch = await compare(password, users[0].password!);
          if (!passwordsMatch) {
            console.log('[Auth] Invalid password for user:', email);
            return null;
          }
          console.log('[Auth] User authorized successfully:', email);
          return { ...users[0], token } as User; // Cast to our custom User type
        } catch (error) {
          console.error('[Auth] Authorization error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log('[Auth] JWT callback called');
      try {
        if (user) {
          console.log('[Auth] Adding user data to JWT token');
          token.id = user.id;
          token.token = (user as User).token; // Use type assertion here
        }
        return token;
      } catch (error) {
        console.error('[Auth] JWT callback error:', error);
        return token;
      }
    },
    async session({
      session,
      token,
    }: {
      session: ExtendedSession;
      token: any;
    }) {
      console.log('[Auth] Session callback called');
      try {
        if (session.user) {
          console.log('[Auth] Adding token data to session');
          session.user.id = token.id as string;
          session.user.token = token.token as string; // Add token to session
        }
        return session;
      } catch (error) {
        console.error('[Auth] Session callback error:', error);
        return session;
      }
    },
  },
});
