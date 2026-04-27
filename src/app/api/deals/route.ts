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
    const { currency, spread, flexibility, partyBEmail, initialRange, description } = body;

    if (!currency || !spread || flexibility === undefined || !partyBEmail || !initialRange) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Sanitize description: trim, limit length, and basic escaping
    const sanitizedDescription = typeof description === 'string' 
      ? description.trim().substring(0, 2048) 
      : undefined;

    const dealId = await createDeal({
      currency,
      spread,
      partyAEmail: user.email,
      partyBEmail,
      flexibility,
      initialRange,
      description: sanitizedDescription,
    });

    return NextResponse.json({ dealId }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating deal:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    // Use 400 for bad request/validation, otherwise 500
    const status = message.includes('exceeds') || message.includes('must overlap') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
