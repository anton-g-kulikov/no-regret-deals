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
  } catch (error: any) {
    console.error('Error submitting bid:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
