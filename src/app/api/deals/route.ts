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
    const { currency, frequency, spread, flexibility, partyBEmail, initialRange, description } = body;

    if (!currency || !frequency || !spread || flexibility === undefined || !partyBEmail || !initialRange || !description || !description.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Sanitize description: trim and limit length
    const sanitizedDescription = description.trim().substring(0, 2048);

    const dealId = await createDeal({
      currency,
      frequency,
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
