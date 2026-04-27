import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { decideRound2 } from '@/lib/db';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser(req);
  if (!user || !user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { party, accept } = body;

    if (!party || accept === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await decideRound2({
      dealId: id,
      party,
      accept,
      userEmail: user.email,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in decision:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
