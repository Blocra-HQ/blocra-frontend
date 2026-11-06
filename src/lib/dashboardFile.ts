// The Dashboard Builder's JSON export/import format. Pure, so it can be tested from node.
//
// A file holds the dashboard definition only: each widget's SQL, chart type,
// position and size. Query widgets are re-run after import; snapshot widgets
// (fixed figures handed over from Contract Analysis) carry their rows.

import { WIDGET_TYPES, type Row, type WidgetType } from './widgetData';

export const DASHBOARD_FILE_FORMAT = 'blocra-dashboard';
export const DASHBOARD_FILE_VERSION = 1;

export interface DashboardFileWidget {
  title: string;
  type: WidgetType;
  query?: string;
  rows?: Row[];
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export interface DashboardFile {
  format: typeof DASHBOARD_FILE_FORMAT;
  version: number;
  exported_at: string;
  name: string;
  description: string;
  widgets: DashboardFileWidget[];
}

interface WidgetLike {
  title: string;
  type: WidgetType;
  query?: string;
  snapshot?: boolean;
  rows?: Row[];
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export function serializeDashboard(
  d: { name: string; description: string; widgets: WidgetLike[] },
  now = new Date(),
): DashboardFile {
  return {
    format: DASHBOARD_FILE_FORMAT,
    version: DASHBOARD_FILE_VERSION,
    exported_at: now.toISOString(),
    name: d.name,
    description: d.description,
    widgets: d.widgets.map((w) => ({
      title: w.title,
      type: w.type,
      ...(w.query ? { query: w.query } : { rows: w.rows ?? [] }),
      position: { x: Math.round(w.position.x), y: Math.round(w.position.y) },
      size: { width: Math.round(w.size.width), height: Math.round(w.size.height) },
    })),
  };
}

function num(v: unknown, fallback: number, min = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.max(min, v) : fallback;
}

/** Reads a dashboard file; throws a readable Error when it is not one. */
export function parseDashboardFile(text: string): Omit<DashboardFile, 'format' | 'version' | 'exported_at'> {
  let body: any;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error('The file is not valid JSON');
  }
  if (!body || typeof body !== 'object' || body.format !== DASHBOARD_FILE_FORMAT) {
    throw new Error('Not a BlocRA dashboard file (missing "format": "blocra-dashboard")');
  }
  if (typeof body.version !== 'number' || body.version > DASHBOARD_FILE_VERSION) {
    throw new Error(`Unsupported dashboard file version ${body.version}`);
  }
  if (!Array.isArray(body.widgets)) throw new Error('The dashboard file has no widgets list');

  const widgets: DashboardFileWidget[] = body.widgets.map((w: any, i: number) => {
    if (!w || typeof w !== 'object') throw new Error(`Widget ${i + 1} is not an object`);
    const query = typeof w.query === 'string' && w.query.trim() ? w.query.trim() : undefined;
    const rows = Array.isArray(w.rows) ? w.rows.filter((r: unknown) => r && typeof r === 'object') : undefined;
    if (!query && !rows) throw new Error(`Widget ${i + 1} has neither a query nor rows`);
    return {
      title: typeof w.title === 'string' && w.title.trim() ? w.title.trim() : `Widget ${i + 1}`,
      type: (WIDGET_TYPES as string[]).includes(w.type) ? w.type : 'table',
      ...(query ? { query } : { rows }),
      position: { x: num(w.position?.x, 20), y: num(w.position?.y, 20 + i * 40) },
      size: { width: num(w.size?.width, 420, 200), height: num(w.size?.height, 300, 150) },
    };
  });
  return {
    name: typeof body.name === 'string' && body.name.trim() ? body.name.trim() : 'Imported Dashboard',
    description: typeof body.description === 'string' ? body.description : '',
    widgets,
  };
}
