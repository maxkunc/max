import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase.js';
import { SB_URL } from '../supabase-config.js';
import { OPT_OUT_KEY } from '../analytics.js';

const RANGES = [
  { key: 1, label: '24 hours' },
  { key: 7, label: '7 days' },
  { key: 30, label: '30 days' },
  { key: 90, label: '90 days' },
];
const LIVE_MS = 90 * 1000;
const COLS = 'id, created_at, last_seen_at, visitor_hash, path, ref_host, referrer, utm_source, utm_medium, utm_campaign, country, country_code, region, city, org, device, browser, browser_version, os, os_version, screen, viewport, language, timezone, duration_s, max_scroll';

const dayKey = (iso) => iso.slice(0, 10);
const fmtDur = (s) => (s >= 60 ? `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s` : `${s}s`);
const flag = (cc) => (cc && cc.length === 2 ? String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 127397 + c.charCodeAt(0))) : '');
const pct = (a, b) => (b ? Math.round(((a - b) / b) * 100) : null);

/** Visitors = unique per day (the anonymous id changes daily), summed over the range. */
const visitors = (rows) => new Set(rows.map((r) => `${dayKey(r.created_at)}|${r.visitor_hash}`)).size;

function source(r) {
  if (r.utm_source) return r.utm_source.toLowerCase();
  const h = (r.ref_host || '').toLowerCase();
  if (!h || h === location.hostname) return 'Direct / unknown';
  if (/(^|\.)instagram\.com$/.test(h)) return 'instagram.com';
  if (/(^|\.)facebook\.com$|fb\.me$/.test(h)) return 'facebook.com';
  if (/(^|\.)google\./.test(h)) return 'Google';
  if (/(^|\.)t\.co$|twitter\.com|x\.com$/.test(h)) return 'X / Twitter';
  if (/linkedin\.com|lnkd\.in/.test(h)) return 'linkedin.com';
  return h;
}

function count(rows, fn, { unique = true } = {}) {
  const m = new Map();
  for (const r of rows) {
    const k = fn(r);
    if (k === null || k === undefined || k === '') continue;
    if (!m.has(k)) m.set(k, new Set());
    m.get(k).add(unique ? `${dayKey(r.created_at)}|${r.visitor_hash}` : r.id ?? Math.random());
  }
  return [...m.entries()].map(([k, s]) => [k, s.size]).sort((a, b) => b[1] - a[1]);
}

export default function Stats() {
  const [range, setRange] = useState(() => { try { return Number(sessionStorage.getItem('mk-stats-range')) || 7; } catch { return 7; } });
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());

  const load = useCallback(async () => {
    setError('');
    const since = new Date(Date.now() - 2 * range * 864e5).toISOString(); // current + previous period
    const [v, e] = await Promise.all([
      supabase.from('analytics_visits').select(COLS).gte('created_at', since).order('created_at', { ascending: false }).range(0, 19999),
      supabase.from('analytics_events').select('visit_id, created_at, name, props').gte('created_at', since).order('created_at', { ascending: false }).range(0, 19999),
    ]);
    if (v.error || e.error) return setError((v.error || e.error).message);
    setData({ visits: v.data, events: e.data });
    setNow(Date.now());
  }, [range]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { try { sessionStorage.setItem('mk-stats-range', String(range)); } catch { /* ignore */ } }, [range]);
  // Refresh every 30 s so "live now" stays current.
  useEffect(() => { const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  const s = useMemo(() => {
    if (!data) return null;
    const cut = now - range * 864e5;
    const cur = data.visits.filter((r) => Date.parse(r.created_at) >= cut);
    const prev = data.visits.filter((r) => Date.parse(r.created_at) < cut);
    const evCur = data.events.filter((r) => Date.parse(r.created_at) >= cut);
    const timed = cur.filter((r) => r.duration_s > 0);
    const avg = timed.length ? Math.round(timed.reduce((a, r) => a + r.duration_s, 0) / timed.length) : 0;
    const prevTimed = prev.filter((r) => r.duration_s > 0);
    const prevAvg = prevTimed.length ? Math.round(prevTimed.reduce((a, r) => a + r.duration_s, 0) / prevTimed.length) : 0;

    // Time buckets: hours for 24 h, days otherwise.
    const hourly = range === 1;
    const buckets = [];
    const n = hourly ? 24 : range;
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now - i * (hourly ? 3600e3 : 864e5));
      buckets.push(hourly ? d.toISOString().slice(0, 13) : d.toISOString().slice(0, 10));
    }
    const byBucket = Object.fromEntries(buckets.map((b) => [b, []]));
    for (const r of cur) { const k = r.created_at.slice(0, hourly ? 13 : 10); if (byBucket[k]) byBucket[k].push(r); }

    const eventsByVisit = new Map();
    for (const e of evCur) eventsByVisit.set(e.visit_id, (eventsByVisit.get(e.visit_id) || 0) + 1);

    return {
      live: data.visits.filter((r) => now - Date.parse(r.last_seen_at) < LIVE_MS).length,
      kpis: [
        { label: 'Visitors', value: visitors(cur), delta: pct(visitors(cur), visitors(prev)), main: true },
        { label: 'Page views', value: cur.length, delta: pct(cur.length, prev.length) },
        { label: 'Avg. time on site', value: fmtDur(avg), delta: pct(avg, prevAvg) },
        { label: 'Avg. scroll depth', value: `${cur.length ? Math.round(cur.reduce((a, r) => a + r.max_scroll, 0) / cur.length) : 0}%` },
      ],
      series: buckets.map((b) => ({ key: b, visitors: visitors(byBucket[b]), views: byBucket[b].length })),
      hourly,
      breakdowns: [
        { title: 'Sources', rows: count(cur, source) },
        { title: 'Countries', rows: count(cur, (r) => (r.country ? `${flag(r.country_code)} ${r.country}` : 'Unknown')) },
        { title: 'Cities', rows: count(cur, (r) => (r.city ? `${r.city}${r.country_code ? `, ${r.country_code}` : ''}` : null)) },
        { title: 'Networks (provider / company)', rows: count(cur, (r) => r.org) },
        { title: 'Devices', rows: count(cur, (r) => r.device) },
        { title: 'Browsers', rows: count(cur, (r) => r.browser) },
        { title: 'Operating systems', rows: count(cur, (r) => (r.os ? `${r.os}${r.os_version ? ` ${r.os_version}` : ''}` : null)) },
        { title: 'Screen sizes', rows: count(cur, (r) => r.screen) },
        { title: 'Languages', rows: count(cur, (r) => r.language) },
        { title: 'Campaigns (UTM)', rows: count(cur, (r) => (r.utm_campaign ? `${r.utm_campaign}${r.utm_medium ? ` · ${r.utm_medium}` : ''}` : null)) },
        { title: 'Projects opened', unit: 'opens', rows: count(evCur.filter((e) => e.name === 'project_open'), (e) => e.props?.title, { unique: false }) },
        { title: 'Contact & link clicks', unit: 'clicks', rows: count(evCur.filter((e) => e.name === 'outbound_click'), (e) => e.props?.text || e.props?.href, { unique: false }) },
      ],
      recent: cur.slice(0, 50).map((r) => ({ ...r, events: eventsByVisit.get(r.id) || 0, live: now - Date.parse(r.last_seen_at) < LIVE_MS })),
    };
  }, [data, range, now]);

  return (
    <>
      <section className="card">
        <div className="card__head">
          <h3>Visitors</h3>
          <div className="seg" role="group" aria-label="Time range">
            {RANGES.map((r) => (
              <button key={r.key} type="button" className={r.key === range ? 'is-active' : ''} onClick={() => setRange(r.key)}>{r.label}</button>
            ))}
          </div>
        </div>
        {error && <p className="note danger">Couldn’t load stats: {error}</p>}
        {!s && !error && <p className="note">Loading…</p>}
        {s && (
          <>
            <div className="kpis">
              <div className="kpi kpi--live">
                <span className="kpi__label"><span className={`dot${s.live ? ' is-on' : ''}`} aria-hidden="true" />Live now</span>
                <span className="kpi__value">{s.live}</span>
              </div>
              {s.kpis.map((k) => (
                <div key={k.label} className={`kpi${k.main ? ' kpi--main' : ''}`}>
                  <span className="kpi__label">{k.label}</span>
                  <span className="kpi__value">{k.value}</span>
                  {k.delta !== undefined && k.delta !== null && (
                    <span className="kpi__delta">{k.delta > 0 ? '▲' : k.delta < 0 ? '▼' : '•'} {Math.abs(k.delta)}% vs previous {RANGES.find((r) => r.key === range).label}</span>
                  )}
                </div>
              ))}
            </div>
            <Bars series={s.series} hourly={s.hourly} />
          </>
        )}
      </section>

      {s && (
        <div className="breakdowns">
          {s.breakdowns.map((b) => <Breakdown key={b.title} {...b} />)}
        </div>
      )}

      {s && (
        <section className="card">
          <div className="card__head"><h3>Latest visits</h3></div>
          {s.recent.length === 0 ? <p className="note">No visits in this period yet.</p> : (
            <div className="table-wrap">
              <table className="visits">
                <thead><tr><th>When</th><th>Where</th><th>Network</th><th>Came from</th><th>Device</th><th>Time</th><th>Scroll</th><th>Clicks</th></tr></thead>
                <tbody>
                  {s.recent.map((r) => (
                    <tr key={r.id}>
                      <td>{r.live && <span className="dot is-on" title="Live now" />} {new Date(r.created_at).toLocaleString([], { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                      <td>{flag(r.country_code)} {[r.city, r.region !== r.city ? r.region : null, r.country].filter(Boolean).join(', ') || '—'}</td>
                      <td>{r.org || '—'}</td>
                      <td title={r.referrer || ''}>{source(r)}</td>
                      <td>{[r.device, r.os, r.browser].filter(Boolean).join(' · ')}<span className="muted"> {r.screen}</span></td>
                      <td className="num">{fmtDur(r.duration_s)}</td>
                      <td className="num">{r.max_scroll}%</td>
                      <td className="num">{r.events}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <Exclusions onChange={load} />
    </>
  );
}

function Bars({ series, hourly }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(1, ...series.map((d) => d.visitors));
  const label = (k) => (hourly ? `${new Date(`${k}:00:00Z`).getHours()}:00` : new Date(`${k}T12:00:00Z`).toLocaleDateString([], { day: 'numeric', month: 'numeric' }));
  const every = Math.ceil(series.length / 8);
  return (
    <div className="bars" onMouseLeave={() => setHover(null)}>
      <div className="bars__plot" role="img" aria-label={`Visitors per ${hourly ? 'hour' : 'day'}`}>
        {series.map((d, i) => (
          <div key={d.key} className={`bars__col${hover === i ? ' is-hover' : ''}`} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={0}>
            <div className="bars__bar" style={{ height: `${(d.visitors / max) * 100}%` }} />
          </div>
        ))}
        {hover !== null && (
          <div className="bars__tip" style={{ left: `${((hover + 0.5) / series.length) * 100}%` }}>
            <strong>{label(series[hover].key)}</strong>
            <span>{series[hover].visitors} visitors · {series[hover].views} views</span>
          </div>
        )}
      </div>
      <div className="bars__axis" aria-hidden="true">
        {series.map((d, i) => <span key={d.key}>{i % every === 0 ? label(d.key) : ''}</span>)}
      </div>
      <details className="bars__table">
        <summary>Show as table</summary>
        <table><thead><tr><th>{hourly ? 'Hour' : 'Day'}</th><th>Visitors</th><th>Views</th></tr></thead>
          <tbody>{series.map((d) => <tr key={d.key}><td>{label(d.key)}</td><td className="num">{d.visitors}</td><td className="num">{d.views}</td></tr>)}</tbody>
        </table>
      </details>
    </div>
  );
}

function Breakdown({ title, rows, unit = 'visitors' }) {
  const [all, setAll] = useState(false);
  const total = rows.reduce((a, [, n]) => a + n, 0);
  const max = rows[0]?.[1] || 1;
  const shown = all ? rows : rows.slice(0, 8);
  return (
    <section className="card breakdown">
      <div className="card__head"><h3>{title}</h3><span className="muted small">{unit}</span></div>
      {rows.length === 0 ? <p className="note">No data yet.</p> : (
        <ul className="hbars">
          {shown.map(([k, n]) => (
            <li key={k} title={`${k}: ${n} ${unit} (${Math.round((n / total) * 100)}%)`}>
              <span className="hbars__fill" style={{ width: `${(n / max) * 100}%` }} />
              <span className="hbars__label">{k}</span>
              <span className="hbars__value">{n}</span>
            </li>
          ))}
        </ul>
      )}
      {rows.length > 8 && <button type="button" className="link" onClick={() => setAll(!all)}>{all ? 'Show less' : `Show all ${rows.length}`}</button>}
    </section>
  );
}

function Exclusions({ onChange }) {
  const [list, setList] = useState([]);
  const [myIp, setMyIp] = useState(null);
  const [manual, setManual] = useState('');
  const [msg, setMsg] = useState('');
  const [optOut, setOptOut] = useState(() => { try { return localStorage.getItem(OPT_OUT_KEY) === '1'; } catch { return false; } });

  const load = useCallback(async () => {
    const { data } = await supabase.from('analytics_excluded_ips').select('*').order('created_at', { ascending: false });
    setList(data || []);
  }, []);
  useEffect(() => {
    load();
    fetch(`${SB_URL}/functions/v1/track?whoami`).then((r) => r.json()).then((d) => setMyIp(d.ip || null)).catch(() => setMyIp(null));
  }, [load]);

  async function add(ip, label) {
    ip = ip.trim();
    if (!/^[0-9a-f.:]{3,45}$/i.test(ip)) return setMsg('That doesn’t look like an IP address.');
    const { error } = await supabase.from('analytics_excluded_ips').insert({ ip, label: label || null });
    setMsg(error ? (error.code === '23505' ? 'That IP is already excluded.' : error.message) : `Visits from ${ip} won’t be counted from now on.`);
    setManual('');
    load(); onChange?.();
  }
  async function remove(ip) {
    await supabase.from('analytics_excluded_ips').delete().eq('ip', ip);
    load();
  }
  function toggleBrowser() {
    const next = !optOut;
    try { next ? localStorage.setItem(OPT_OUT_KEY, '1') : localStorage.removeItem(OPT_OUT_KEY); } catch { /* ignore */ }
    setOptOut(next);
  }

  const mineExcluded = myIp && list.some((x) => x.ip === myIp);
  return (
    <section className="card">
      <div className="card__head"><h3>Don’t count me</h3></div>
      <p className="note">
        Visits from these IP addresses are never recorded. Home Wi-Fi usually keeps the same IP for a while;
        mobile data changes it often, so also switch on “Don’t count this browser” on each of your devices.
      </p>
      <div className="row">
        <button type="button" className="btn btn--primary" disabled={!myIp || mineExcluded} onClick={() => add(myIp, 'Added from admin')}>
          {mineExcluded ? `Your IP (${myIp}) is excluded` : myIp ? `Exclude my current IP (${myIp})` : 'Finding your IP…'}
        </button>
        <label className="f f--check" style={{ paddingTop: 0 }}>
          <input type="checkbox" checked={optOut} onChange={toggleBrowser} />
          <span>Don’t count this browser</span>
        </label>
      </div>
      <form className="row" onSubmit={(e) => { e.preventDefault(); add(manual, 'Added manually'); }}>
        <input className="ip-input" placeholder="Add an IP address manually" value={manual} onChange={(e) => setManual(e.target.value)} aria-label="IP address" />
        <button type="submit" className="btn" disabled={!manual.trim()}>Add</button>
      </form>
      {msg && <p className="note">{msg}</p>}
      {list.length > 0 && (
        <ul className="ip-list">
          {list.map((x) => (
            <li key={x.ip}>
              <code>{x.ip}</code>{x.ip === myIp && <em>this device</em>}
              <span className="muted small">{x.label} · {new Date(x.created_at).toLocaleDateString()}</span>
              <button type="button" className="link danger" onClick={() => remove(x.ip)}>remove</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
