# No Regret Deals 🤝

**No Regret Deals** is a privacy-preserving negotiation platform and bounded alignment protocol designed to help two parties reach an agreement on high-value subjects without revealing their true "walk-away" targets prematurely.

## The Protocol

When negotiating a salary, acquiring art, or closing an M&A deal, revealing your target price first can leave money on the table (the "Winner's Curse"). The **Private Bounded Alignment Protocol (PBAP)** solves this by acting as a trusted, zero-knowledge intermediary.

1. **Party A (Initiator)** creates a deal securely, setting a Negotiation Subject, their counterpart's email, their Ideal Target, and their maximum Negotiation Spread (e.g., 15%).
2. **Party B (Responder)** is securely invited and submits their own No Regret Target.
3. The protocol automatically generates and privately compares ranges based on the chosen flexibility constraint.
4. **Outcome**:
   - If the ranges overlap, the deal is **Matched**, and the exact midpoint of the overlap is revealed to both parties.
   - If the ranges do not overlap, **no data is shared**, and the negotiation safely concludes without either party losing leverage.

## Tech Stack

This project is built with modern, secure, and highly scalable technologies:

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Database**: [Firebase Firestore](https://firebase.google.com/docs/firestore)
- **Authentication**: [Firebase Auth](https://firebase.google.com/docs/auth) (Google OAuth strictly enforced)
- **Deployment**: [Firebase App Hosting](https://firebase.google.com/docs/app-hosting)
- **Styling**: `styled-jsx` & CSS Modules

## Architecture & Security

Security and concurrency are paramount in this protocol. 

- **Role-Based Access Control (RBAC)**: All Firestore mutations are handled server-side via Next.js API Routes using the Firebase Admin SDK. Client-side writes are strictly denied via `firestore.rules`.
- **Atomic Transactions**: Deal evaluations (especially concurrent submissions in Round 2) are guaranteed atomic via Firestore `db.runTransaction()`, completely eliminating race conditions.
- **Identity Lock**: Deals are explicitly locked to specific Google accounts. Even if the URL is leaked, uninvited parties cannot interact with the protocol.

## Getting Started

### Prerequisites

You will need Node.js (v18+ recommended) and the Firebase CLI installed.

```bash
npm install -g firebase-tools
```

### Local Development Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Copy the `.env.example` to `.env` and fill in your Firebase config values.

3. **Start the Firebase Emulators**
   The project is configured to use local emulators for Auth and Firestore during development.
   ```bash
   npx firebase emulators:start
   ```

4. **Run the Next.js Development Server**
   In a separate terminal:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

This application is designed to be deployed using **Firebase App Hosting**, which natively supports Next.js applications, server-side rendering, and API routes.

1. **Deploying the Application**
   Deploy the web app using the Firebase CLI:
   ```bash
   npx firebase apphosting:backends:create
   ```
   Or, if the backend is already set up, simply push your code to your GitHub repository to trigger an automatic App Hosting rollout.

2. **Deploying Security Rules**
   Any changes made to the database access policies must be deployed manually:
   ```bash
   npx firebase deploy --only firestore:rules
   ```

## Testing

The project includes a suite of tests ensuring the mathematical logic of the alignment engine is flawless.

```bash
npm run test
```

## Contributing

When contributing to this project, please adhere to the strict `styled-jsx` rules for components, and ensure all new backend logic relies exclusively on server-side Next.js route handlers rather than client-side Firestore mutations.

## License

MIT
