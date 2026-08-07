import { handlers } from "../../../../auth";

// Auth.js catch-all route — handles the sign-in flow, CSRF, session callbacks
// and the sign-out endpoint under /api/auth/*.
export const { GET, POST } = handlers;
