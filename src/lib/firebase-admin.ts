import admin from 'firebase-admin';

const FALLBACK_ID = 'no-regret-deals';

/**
 * The ultimate project ID sanitizer. 
 * Prevents "your-project-id" from leaking into the Admin SDK.
 */
function getFinalProjectId(): string {
  const p1 = process.env.FIREBASE_PROJECT_ID || process.env.ADMIN_PROJECT_ID;
  const p2 = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  
  console.log(`🔍 ENV Check: PROJECT_ID="${p1}", NEXT_PUBLIC="${p2}"`);

  const isPlaceholder = (id?: string) => 
    !id || id.includes('your-') || id.includes('your_') || id === 'undefined' || id === 'null';

  if (!isPlaceholder(p1)) return p1!;
  if (!isPlaceholder(p2)) return p2!;
  
  return FALLBACK_ID;
}

const PROJECT_ID = getFinalProjectId();

export function initializeFirebaseAdmin() {
  // Purge any existing apps to ensure fresh config
  if (admin.apps.length > 0) {
    admin.apps.forEach(app => {
      console.log(`🧹 Purging existing app: ${app?.name} (${app?.options.projectId})`);
      app?.delete().catch(() => {});
    });
  }

  if (process.env.NODE_ENV === 'development') {
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
    process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
  }

  const firebaseAdminConfig = {
    projectId: PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || process.env.ADMIN_CLIENT_EMAIL,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || process.env.ADMIN_PRIVATE_KEY)?.replace(/\\n/g, '\n'),
  };

  const useServiceAccount = 
    firebaseAdminConfig.clientEmail && 
    firebaseAdminConfig.privateKey && 
    !firebaseAdminConfig.clientEmail.includes('your_service_account');

  if (useServiceAccount) {
    console.log(`🔐 Initializing Admin with Service Account (Project: ${PROJECT_ID})`);
    admin.initializeApp({
      credential: admin.credential.cert(firebaseAdminConfig as admin.ServiceAccount),
      projectId: PROJECT_ID,
    });
  } else {
    console.log(`☁️ Initializing Admin with Project ID: ${PROJECT_ID} (Emulator Mode)`);
    admin.initializeApp({
      projectId: PROJECT_ID
    });
  }

  return admin.firestore();
}

export const db = initializeFirebaseAdmin();
export { admin };
