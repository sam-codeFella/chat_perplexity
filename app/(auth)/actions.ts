'use server';

import { z } from 'zod';
import { API_BASE_URL } from '@/lib/config';

import { signIn } from './auth';

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export interface LoginActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data';
}

export const login = async (
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  console.log('[Auth Actions] Login attempt started');
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });
    console.log('[Auth Actions] Validation successful for email:', validatedData.email);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: validatedData.email,
        password: validatedData.password,
      }),
    });

    const data = await response.json();
    console.log('[Auth Actions] Login API response status:', response.status);
    console.log('[Auth Actions] Token received:', !!data.token);

    if (!response.ok) {
      console.log('[Auth Actions] Login API failed with status:', response.status);
      return { status: 'failed' };
    }

    // If login API call is successful, proceed with signIn
    console.log('[Auth Actions] Proceeding with NextAuth signIn');
    try {
      const signInResult = await signIn('credentials', {
        email: validatedData.email,
        username: validatedData.email.split('@')[0],
        password: validatedData.password,
        token: data.token,
        redirect: false,
      });
      console.log('[Auth Actions] NextAuth signIn result:', signInResult);
    } catch (signInError) {
      console.error('[Auth Actions] NextAuth signIn error:', signInError);
      return { status: 'failed' };
    }

    console.log('[Auth Actions] Login successful');
    return { status: 'success' };
  } catch (error) {
    console.error('[Auth Actions] Login error:', error);
    if (error instanceof z.ZodError) {
      console.log('[Auth Actions] Validation error');
      return { status: 'invalid_data' };
    }
    return { status: 'failed' };
  }
};

export interface RegisterActionState {
  status:
    | 'idle'
    | 'in_progress'
    | 'success'
    | 'failed'
    | 'user_exists'
    | 'invalid_data';
}

//what is the matter with tokens here ?
//What is the architecture we have and what more am i supposed to add ?
export const register = async (
  _: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: validatedData.email,
        username: validatedData.email.split('@')[0],
        password: validatedData.password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 409) {
        return { status: 'user_exists' };
      }
      return { status: 'failed' };
    }
    console.log("yahoooooooo");

    // Store the token in a secure way (you might want to use a more secure method)
    if (data.token) {
      // You can store the token in an HTTP-only cookie or secure storage
      // For now, we'll just proceed with sign in
      await signIn('credentials', {
        email: validatedData.email,
        password: validatedData.password,
        redirect: false,
      });
    }

    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }
    return { status: 'failed' };
  }
};
