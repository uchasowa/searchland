import { createApp } from '../dist/expressApp.js';

/** Vercel’s Node runtime accepts an Express `app` as the default export (no `serverless-http`). */
const app = createApp();
export default app;
