import 'server-only';
import {
  healthResponseSchema,
  type HealthResponse,
} from '@expense-tracker/shared';
import { apiFetch } from './client';

/** Статус API или null, если API недоступен. */
export async function getHealth(): Promise<HealthResponse | null> {
  try {
    return await apiFetch('/health', healthResponseSchema);
  } catch {
    return null;
  }
}
