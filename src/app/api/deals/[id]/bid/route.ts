import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { submitBid } from '@/lib/db';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser(req);
  if (!user || !user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { party, round, range } = body;

    if (!party || !round || !range) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await submitBid({
      dealId: id,
      party,
      round,
      range,
      userEmail: user.email,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error submitting bid:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    const status = message.includes('exceeds') || message.includes('must overlap') || message.includes('Unauthorized') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
