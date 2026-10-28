<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { groupByCause, readAs, uniqueById, type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';

  // tickets: cause → the ticket filed for it and where it stands. Reports the desk read as a
  // one-day move are counted where they're filed and footnoted, as on the #4471 page.
  type Filed = { href: string; status: string };
  let { ticket, tickets = {}, oneDayMove }: { ticket: number; tickets?: Record<string, Filed>; oneDayMove?: Filed } =
    $props();

  const all = $derived(uniqueById(reports as Report[]));
  const merged = $derived(all.filter((r) => r.mergedInto === ticket));
  const groups = $derived(groupByCause(merged, tenantOf));
  const channels = (rs: Report[]) =>
    Object.entries(rs.reduce<Record<string, number>>((n, r) => ({ ...n, [r.channel]: (n[r.channel] ?? 0) + 1 }), {}))
      .sort((a, b) => b[1] - a[1])
      .map(([ch, n]) => `${ch} ×${n}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{merged.length}</strong> reports merged into #{ticket} ·
  <strong>{groups.length + (oneDayMove ? 1 : 0)}</strong> problems
</p>

<table>
  <thead>
    <tr><th>cause</th><th>reports</th><th>channels</th><th>tenants</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each groups as g (g.cause)}
      <tr>
        <td><code>{g.cause}</code></td>
        <td>{g.reports.length}</td>
        <td class="tags">{channels(g.reports)}</td>
        <td>{g.tenants}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td>{#if tickets[g.cause]}<a href={tickets[g.cause].href}>{tickets[g.cause].status}</a>{:else}none{/if}</td>
      </tr>
    {/each}
  </tbody>
</table>

{#each groups as g (g.cause)}
  {@const moved = readAs(g, notes.oneDayMove)}
  {#if moved}
    <p class="note">
      {moved} of the <code>{g.cause}</code> reports read as a one-day move, not a flip: a problem of their own{#if oneDayMove},
        <a href={oneDayMove.href}>{oneDayMove.status}</a>{/if}.
    </p>
  {/if}
{/each}

<p class="note">Export rows: {(reports as Report[]).length}, unique report ids: {all.length}. The rest came twice from overlapping export pages.</p>

<style>
  .sum { font-size: 1.1rem; }
  .tags { color: var(--muted); font-size: 0.85em; }
  .note { color: var(--muted); font-size: 0.85em; }
</style>
