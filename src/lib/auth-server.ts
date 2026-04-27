import { admin } from './firebase-admin';

export async function verifyIdToken(token: string) {
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log('✅ Token verified for:', decodedToken.email);
    return decodedToken;
  } catch (error: any) {
    console.error('❌ Error verifying ID token:', error.message);
    // Log more details if it's an emulator issue
    if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
      console.log('Current Auth Emulator Host:', process.env.FIREBASE_AUTH_EMULATOR_HOST);
    }
    return null;
  }
}

export async function getAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    console.warn('⚠️ Missing or invalid Authorization header');
    return null;
  }
  
  const token = authHeader.split('Bearer ')[1];
  return verifyIdToken(token);
}
