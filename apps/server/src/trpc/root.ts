import { feedbackRouter } from './routers/feedback.js';
import { router } from './trpc.js';

export const appRouter = router({
  feedback: feedbackRouter,
});

export type AppRouter = typeof appRouter;
