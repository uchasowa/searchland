import serverless from 'serverless-http';
import { createApp } from '../dist/app.js';

const app = createApp();
export default serverless(app);
