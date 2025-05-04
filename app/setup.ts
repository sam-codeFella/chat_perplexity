// This file runs early in the app lifecycle
import { setupAuthSecret } from '@/lib/setupAuthSecret';

// Ensure auth secrets are properly configured
setupAuthSecret();

// Force export something to avoid being tree-shaken
export const setupComplete = true; 