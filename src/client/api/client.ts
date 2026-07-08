import { hc } from 'hono/client';
import type { AppType } from '../../server/app';

// All requests go through the Vite dev proxy (/api → localhost:3000).
export const api = hc<AppType>('/api');
