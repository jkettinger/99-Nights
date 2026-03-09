import type { RowDataPacket } from 'mysql2';

export interface DestinationRow extends RowDataPacket {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  map_x: number;
  map_y: number;
  icon: string | null;
  audio: string | null;
  created_at: Date;
  updated_at: Date;
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
