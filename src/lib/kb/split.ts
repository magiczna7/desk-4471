// #4471 split into the problems it holds. causes.ts places a report by tenant; the desk's one-day
// moves (desk-notes.json) are not a flip at all, so here they are a cause of their own.
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type SplitCause = 'parser' | 'hint' | 'one-day-move' | 'unplaced';

export function splitCause(r: Report, t: Tenant | undefined, oneDayMove: readonly string[]): SplitCause {
  if (oneDayMove.includes(r.id)) return 'one-day-move';
  return causeOf(r, t) ?? 'unplaced';
}

export type SplitRow = {
  cause: SplitCause;
  reports: number;
  tenants: number;
  channels: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
};

export type Split = { rows: number; unique: number; merged: number; split: SplitRow[] };

export function splitTicket(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): Split {
  const unique = uniqueById(all);
  const merged = unique.filter((r) => r.mergedInto === ticket);
  const byCause = new Map<SplitCause, Report[]>();
  for (const r of merged) {
    const c = splitCause(r, tenantOf(r), oneDayMove);
    byCause.set(c, [...(byCause.get(c) ?? []), r]);
  }
  const split = [...byCause.entries()]
    .map(([cause, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        cause,
        reports: rs.length,
        tenants: new Set(rs.map((r) => r.tenant)).size,
        channels: rs.reduce<Record<string, number>>((n, r) => ({ ...n, [r.channel]: (n[r.channel] ?? 0) + 1 }), {}),
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
      };
    })
    .sort((a, b) => b.reports - a.reports);
  return { rows: all.length, unique: unique.length, merged: merged.length, split };
}
