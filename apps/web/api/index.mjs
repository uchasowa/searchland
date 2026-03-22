import serverless from 'serverless-http';
import { createApp } from '../../server/dist/expressApp.js';

let handler;
export default function api(req, res) {
  if (!handler) handler = serverless(createApp());
  return handler(req, res);
}
