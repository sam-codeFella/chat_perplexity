import { auth } from '@/app/(auth)/auth';
import { getChatsByUserId } from '@/lib/db/queries';
import { Session } from 'next-auth';

interface ExtendedSession extends Session {
  user: {
    id: string;
    token: string;
  } & Session['user'];
}

export async function GET() {

  const session = (await auth()) as ExtendedSession | null;
  if (!session?.user?.id || !session.user.token) {
    return new Response('Unauthorized', { status: 401 });
  }

  //const session = await auth();

  if (!session || !session.user) {
    return Response.json('Unauthorized!', { status: 401 });
  }

  // biome-ignore lint: Forbidden non-null assertion.
  const chats = await getChatsByUserId({ id: session.user.id, token: session.user.token });  
  return Response.json(chats);
}
