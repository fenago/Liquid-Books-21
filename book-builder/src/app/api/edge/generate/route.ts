// Re-export from the main AI generate route
// This provides backwards compatibility for components expecting /api/edge/generate
export { POST } from '@/app/api/ai/generate/route';

// Config must be defined directly, not re-exported
export const runtime = 'edge';
export const maxDuration = 60;
