import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { createDeal } from '@/lib/db';

export async function POST(req: Request) {
  const user = await getAuthenticatedUser(req);
  if (!user || !user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { currency, spread, partyBEmail, initialRange } = body;

    if (!currency || !spread || !partyBEmail || !initialRange) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const dealId = await createDeal({
      currency,
      spread,
      partyAEmail: user.email,
      partyBEmail,
      initialRange,
    });

    return NextResponse.json({ dealId }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating deal:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
