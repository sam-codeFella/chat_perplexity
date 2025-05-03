import { compare } from 'bcrypt-ts';
import NextAuth, { type User as NextAuthUser, type Session } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { getUser } from '@/lib/db/queries';

import { authConfig } from './auth.config';

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
        const users = await getUser(email);
        if (users.length === 0) return null;
        const passwordsMatch = await compare(password, users[0].password!);
        if (!passwordsMatch) return null;
        return { ...users[0], token } as User; // Cast to our custom User type
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.token = (user as User).token; // Use type assertion here
      }
      return token;
    },
    async session({
      session,
      token,
    }: {
      session: ExtendedSession;
      token: any;
    }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.token = token.token as string; // Add token to session
      }
      return session;
    },
  },
});
