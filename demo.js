// Hero demo: a working copy of the Agent Logbook panel, built from media/main.js.
// Every chat, number and memory here is made up; the behaviour is the extension's.
(() => {
  const demo = document.getElementById('demo');
  if (!demo) return;
  const stage = demo.closest('.stage');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------------- helpers
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (q, root = demo) => root.querySelector(q);
  const $$ = (q, root = demo) => [...root.querySelectorAll(q)];
  const money = (n) => '$' + (n >= 1000 ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : n.toFixed(2));
  const nfmt = (n) => (n >= 1e9 ? (n / 1e9).toFixed(1) + 'B' : n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'K' : String(n));
  const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const hex = () => Math.random().toString(16).slice(2, 10);
  // A seeded random, so the digest and dashboard draw the same picture every time
  const rng = (seed) => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  // The extension's own icon paths (media/main.js ICONS); filled ones are marked
  const ICONS = {
    message: ['M4 5.5h16v11H9l-5 4v-4H4z'], card: ['M3 6h18v12H3z', 'M3 10h18'],
    calendar: ['M4 6h16v14H4z', 'M4 10h16', 'M8.5 3.5v3', 'M15.5 3.5v3'],
    book: ['M12 5.2a3.2 3.2 0 0 0-6 1.3 2.8 2.8 0 0 0-1.2 4.6A3 3 0 0 0 6 16.4a3 3 0 0 0 6 .6z', 'M12 5.2a3.2 3.2 0 0 1 6 1.3 2.8 2.8 0 0 1 1.2 4.6A3 3 0 0 1 18 16.4a3 3 0 0 1-6 .6z', 'M12 5.2V17'],
    gear: ['M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z', 'M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z'],
    reload: ['M20 12a8 8 0 1 1-2.4-5.7', 'M20 4v4.5h-4.5'], pulse: ['M3 12h4l2.5-6 4 12 2.5-6H21'],
    chart: ['M4 20V11', 'M10 20V5', 'M16 20v-6', 'M2.5 20h19'], plus: ['M12 5v14', 'M5 12h14'],
    fork: ['M7 7v6a3 3 0 0 0 3 3h7', 'M7 4.6a2.4 2.4 0 1 0 0 .1', 'M17 13.6a2.4 2.4 0 1 0 0 .1', 'M7 19.4a2.4 2.4 0 1 0 0 .1'],
    brief: ['M6 3.5h8.5L19 8v12.5H6z', 'M14 3.5V8h5', 'M9 12.5h7', 'M9 16h5'],
    export: ['M12 15V4', 'M8.2 7.8 12 4l3.8 3.8', 'M4.5 14.5v4A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5v-4'],
    copy: ['M9 9h9.5v11.5H9z', 'M15 6H5.5v11'], layout: ['M4 5h16v14H4z', 'M14 5v14', 'M14 12h6'],
    pencil: ['M4 20l1-4.5L16.2 4.3a1.8 1.8 0 0 1 2.5 0l1 1a1.8 1.8 0 0 1 0 2.5L8.5 19 4 20z'],
    folder: ['M3.2 7.2a1.8 1.8 0 0 1 1.8-1.8h3.3l2 2.4h8.5a1.8 1.8 0 0 1 1.8 1.8v7.6a1.8 1.8 0 0 1-1.8 1.8H5a1.8 1.8 0 0 1-1.8-1.8V7.2z'],
    open: ['M14 4h6v6', 'M20 4l-8.5 8.5', 'M18 14v5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 19V8a1.5 1.5 0 0 1 1.5-1.5H10'],
    terminal: ['M3 5.5h18v13H3z', 'M7 10l2.5 2.3L7 14.6', 'M12.5 15h4.5'], dots: ['M6 12h.01', 'M12 12h.01', 'M18 12h.01'],
    chevron: ['M9 5.5 15.5 12 9 18.5'], bell: ['M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16z', 'M10 20.5a2 2 0 0 0 4 0'],
    list: ['M4 6.5h.01', 'M4 12h.01', 'M4 17.5h.01', 'M9 6.5h11', 'M9 12h11', 'M9 17.5h11'],
    agent: ['M7.5 8.5h9A2.5 2.5 0 0 1 19 11v5.5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 16.5V11a2.5 2.5 0 0 1 2.5-2.5z', 'M12 5.5v3', 'M9.5 12.5v1.5', 'M14.5 12.5v1.5'],
    search: ['M15.8 15.8 20.5 20.5', 'M11 17.4a6.4 6.4 0 1 0 0-12.8 6.4 6.4 0 0 0 0 12.8z'],
    flag: ['M5 21V4', 'M5 4h11l-2 4 2 4H5'], clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 7v5l3 2'],
    back: ['M15 5.5 8.5 12 15 18.5'], close: ['M6 6l12 12', 'M18 6 6 18'],
    play: { fill: 'M8 5.1c0-.8.9-1.3 1.5-.9l9 6.9c.6.4.6 1.4 0 1.8l-9 6.9c-.6.5-1.5 0-1.5-.8V5.1z' },
    pin: { fill: 'M14.2 2.3a1 1 0 0 1 1.4 0l6.1 6.1a1 1 0 0 1-.7 1.7h-3l-3.6 3.6.5 3.3a1 1 0 0 1-1.7.9l-3.3-3.3-4.6 4.6a1 1 0 0 1-1.4-1.4l4.6-4.6-3.3-3.3a1 1 0 0 1 .9-1.7l3.3.5L13 5.1V2.9c0-.2.1-.4.2-.6z' },
    archive: { fill: 'M2 4.5h20v4H2v-4zm2 6h16V21H4V10.5zM9 13h6v2H9v-2z' },
    trash: { fill: 'M9.5 2h5l.9 1.8H20v2H4v-2h4.6L9.5 2zM6 7.5h12l-1 13.5H7L6 7.5z' },
    sparkle: { fill: 'M12 1.5c.4 0 .73.3.79.7l.86 5.35 3.67-3.3a.8.8 0 1 1 1.11 1.11l-3.3 3.67 5.35.86a.8.8 0 0 1 0 1.58l-5.35.86 3.3 3.67a.8.8 0 1 1-1.11 1.11l-3.67-3.3-.86 5.35a.8.8 0 0 1-1.58 0l-.86-5.35-3.67 3.3a.8.8 0 0 1-1.11-1.11l3.3-3.67-5.35-.86a.8.8 0 0 1 0-1.58l5.35-.86-3.3-3.67a.8.8 0 0 1 1.11-1.11l3.67 3.3.86-5.35c.06-.4.39-.7.79-.7z' },
    logbook: ['M21 12a9 9 0 1 1-3.2-6.9', 'M21 3v5h-5', 'M12 7v5l3 2'],
  };
  const icon = (name, cls = '') => {
    const d = ICONS[name];
    if (!Array.isArray(d)) return `<svg class="ic fill ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${d.fill}"/></svg>`;
    return `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${d.map((p) => `<path d="${p}"/>`).join('')}</svg>`;
  };

  // The runner, pixel for pixel from runnerSprite(): a spiral-bound notebook with a bookmark
  const runner = () => {
    const C = '#d97757', D = '#b85f42', P = '#f6e3d3', K = '#2a1d17', W = '#ffffff';
    const r = (x, y, w, h, f) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`;
    const body = r(3, 1, 10, 10, C) + r(12, 2, 1, 8, P) + [2, 4, 6, 8].map((y) => r(2, y, 2, 1, K)).join('') +
      r(5, 2, 6, 2, '#f1c9a8') + r(6, 3, 4, 1, D) + r(6, 5, 1, 2, K) + r(9, 5, 1, 2, K) + r(6, 5, 1, 1, W) + r(9, 5, 1, 1, W) +
      r(7, 8, 2, 1, K) + r(10, 0, 1, 3, '#7fb069') + r(0, 6, 2, 1, D) + r(13, 7, 2, 1, D);
    const a = r(5, 11, 1, 2, D) + r(4, 13, 2, 1, K) + r(10, 11, 1, 1, D) + r(10, 12, 2, 1, K);
    const b = r(6, 11, 1, 1, D) + r(6, 12, 2, 1, K) + r(9, 11, 1, 2, D) + r(8, 13, 2, 1, K);
    return `<div class="runstrip" aria-hidden="true"><div class="runtrack"><div class="runner"><div class="runface"><svg class="runsprite" viewBox="0 0 15 15" shape-rendering="crispEdges"><g>${body}</g><g class="legs a">${a}</g><g class="legs b">${b}</g></svg></div></div></div><span class="runlabel">Claude is working</span></div>`;
  };

  // ---------------------------------------------------------------- data
  const you = (text) => ({ t: 'you', text });
  const ai = (text) => ({ t: 'ai', text });
  // A folded tool line ("Ran 2 commands") and the calls behind it, which the terminal prints one by one
  const tool = (text, calls) => ({ t: 'tool', text, calls });
  const diff = (file, add, del, lines) => ({ t: 'diff', file, add, del, lines });
  const CHATS = [
    { id: '4f2a9c1e', title: 'Fix the flaky login test', folder: 'billing-api', src: 'claude', live: 'busy', cost: 1.84, msgs: 14, ago: 1, model: 'opus', ctx: '38% of 200K', cache: 91, mem: '412 MB', cpu: '3%',
      words: 'session cookie race auth test', ask: 'Find out why it fails one run in five.', reply: 'Ran it 50 times in a row. No failures.',
      blocks: [you('The login test fails about one run in five. Find out why and fix it.'),
        tool('Ran 2 commands', [['Bash', 'npm test -- auth.test.ts --repeat 20', 'Tests: 4 failed, 16 passed'], ['Bash', 'grep -rn "setCookie" src/auth', 'src/auth/login.ts:31:  setCookie(res, token)']]),
        ai('The test reads the session before the cookie is written, so it only passes when the write wins the race.'),
        diff('auth.test.ts', 2, 1, ['-  const session = getSession()', '+  await cookieWritten(page)', '+  const session = getSession()']),
        tool('Ran 1 command', [['Bash', 'npm test -- auth.test.ts --repeat 50', 'Tests: 50 passed']]),
        ai('Ran it 50 times in a row. No failures.')] },
    { id: '7b31d0aa', title: 'Move nightly jobs to a queue', folder: 'billing-api', src: 'claude', live: 'wait', cost: 4.10, msgs: 31, ago: 12, model: 'opus', ctx: '61% of 200K', cache: 88, mem: '690 MB', cpu: '1%',
      words: 'cron retry lock jobs queue', ask: 'Keep the retry rules.', reply: 'Seven jobs moved. Should the two that share a lock run in order?',
      agent: { name: 'Find every cron entry', brief: 'List every cron job in the repo: file, schedule, and anything it locks or retries.', report: 'Found 7 jobs in 3 files. reconcile and invoices share the billing lock; the rest are independent.', tools: 'Read 9 files · Ran 2 commands', uses: 11, cost: 0.21 },
      blocks: [you('Move the nightly cron jobs onto the queue. Keep the retry rules.'),
        tool('Read 3 files', [['Read', 'jobs/nightly.ts', 'Read 112 lines'], ['Read', 'jobs/reconcile.ts', 'Read 64 lines'], ['Read', 'lib/queue.ts', 'Read 88 lines']]),
        { t: 'agent' },
        diff('jobs/nightly.ts', 12, 4, ["-  cron.schedule('0 2 * * *', runNightly)", "+  queue.add('nightly', payload, { retry: 3 })"]),
        ai('Seven jobs moved. Should the two that share a lock run in order?')] },
    { id: 'c9e04b17', title: 'Add rate limits to /export', folder: 'billing-api', src: 'claude', live: '', cost: 0.92, msgs: 9, ago: 60 * 26, model: 'sonnet', ctx: '22% of 200K', cache: 84,
      words: 'rate limit export api key 429', ask: '60 a minute per key is fine.', reply: 'Requests over the limit get a 429 with a Retry-After header.',
      blocks: [you('Add a rate limit to /export. 60 a minute per API key is fine.'),
        tool('Ran 2 commands', [['Bash', 'npm install express-rate-limit', 'added 1 package in 2s'], ['Bash', 'npm test -- export', 'Tests: 12 passed']]),
        diff('routes/export.ts', 1, 0, ["+  router.use('/export', limit({ perMinute: 60, by: 'apiKey' }))"]),
        ai('Done. Requests over the limit get a 429 with a Retry-After header.')] },
    { id: '2d8f6a30', title: 'Rewrite the pricing page copy', folder: 'marketing-site', src: 'claude', live: '', cost: 0.37, msgs: 6, ago: 60 * 50, model: 'sonnet', ctx: '9% of 200K', cache: 76,
      words: 'pricing copy marketing words', ask: 'Shorter. No exclamation marks.', reply: "Each plan now leads with who it's for.",
      blocks: [you('Rewrite the pricing page copy. Shorter. No exclamation marks.'),
        ai("Cut it from 410 words to 160. Each plan now leads with who it's for."),
        diff('pricing.md', 1, 1, ['-  Supercharge your team!', '+  For teams of up to ten.'])] },
    { id: 'a51c7e92', title: 'Dark mode for the docs', folder: 'marketing-site', src: 'claude', live: '', cost: 2.26, msgs: 18, ago: 60 * 75, model: 'opus', ctx: '47% of 200K', cache: 90,
      words: 'dark mode theme docs css palette', ask: "Match the app's dark palette.", reply: "Code blocks use the app's dark theme.",
      blocks: [you("Add dark mode to the docs. Match the app's dark palette."),
        tool('Ran 2 commands', [['Bash', 'grep -rn "--color-" app/theme.css | head', '24 colour tokens'], ['Bash', 'npm run docs:build', 'Built 46 pages in 3.1s']]),
        tool('Edited 3 files', [['Update', 'docs/theme.css', 'Updated docs/theme.css with 41 additions'], ['Update', 'docs/code.css', 'Updated docs/code.css with 12 additions and 3 removals'], ['Update', 'docs/layout.html', 'Updated docs/layout.html with 1 addition']]),
        ai("The docs now follow the system setting. Code blocks use the app's dark theme.")] },
    { id: '019e3f5d', title: 'Crash on cold start', folder: 'mobile-app', src: 'codex', live: '', cost: 1.12, msgs: 11, ago: 60 * 98, model: 'gpt-5-codex', ctx: '18% of 272K', cache: 79,
      words: 'ios crash startup image cache', ask: 'It crashes on a cold start about half the time.', reply: 'It now waits for setup to finish.',
      blocks: [you('The iOS app crashes on a cold start about half the time.'),
        tool('Ran 2 commands', [['Bash', 'xcrun simctl launch booted com.example.app', 'crashed: EXC_BAD_ACCESS in ImageCache.warm()'], ['Bash', 'swift test', 'Executed 38 tests, with 0 failures']]),
        ai("The image cache is read before it's created on first launch. It now waits for setup to finish."),
        diff('AppDelegate.swift', 1, 1, ['-  ImageCache.shared.warm()', '+  await ImageCache.shared.ready()'])] },
  ];
  // A chat running in another editor window, shown on the board only when "every window" is on
  const ELSEWHERE = { id: 'e77b2c04', title: 'Profile the image cache', folder: 'mobile-app', src: 'claude', live: 'busy', cost: 0.64, msgs: 5, ago: 3, other: true,
    ask: 'Why does scrolling stutter?', reply: 'Decoding runs on the main thread. Moving it off now.' };

  const MEMORIES = [
    { project: 'Standing instructions', title: 'CLAUDE.md', path: '~/.claude/CLAUDE.md', desc: 'Read at the start of every session', type: 'instructions', ago: '3d',
      body: '# House rules\n\n- Run the tests before saying something is done.\n- Keep commits small, one change each.\n- Never push without asking.' },
    { project: 'billing-api', title: 'Memory index', index: true, desc: 'What lives where in this folder', ago: '1h',
      body: '- [Test runner](test-runner.md) — run with --runInBand on CI\n- [Billing lock](billing-lock.md) — two jobs share it' },
    { project: 'billing-api', title: 'Billing lock', type: 'project', desc: 'reconcile and invoices share one lock', ago: '1h',
      body: 'reconcile and invoices both take the billing lock. Run them in order, never side by side.\n\n**Why:** a race here double-billed in testing.' },
    { project: 'billing-api', title: 'Test runner', type: 'feedback', desc: 'Use --runInBand on CI', ago: '2d',
      body: 'CI runs tests with --runInBand. Parallel runs share one database and flake.' },
    { project: 'marketing-site', title: 'Voice', type: 'user', desc: 'Short sentences, no exclamation marks', ago: '4d',
      body: 'Copy for this site: short sentences, plain words, no exclamation marks.' },
    { project: 'mobile-app', title: 'Release notes', type: 'reference', provider: 'codex', desc: 'Where the changelog lives', ago: '6d',
      body: 'Release notes go in docs/CHANGELOG.md, newest at the top.' },
  ];

  // Usage numbers per range for the card (made up)
  const RANGES = {
    1: { label: 'Today', tokens: 6.8e6, cost: 9.12, sessions: 4, messages: 37, edits: 22, projects: 2, time: '2h 40m', models: [['opus', 4.9e6, 7.4], ['sonnet', 1.7e6, 1.6], ['haiku', 0.2e6, 0.12]], days: 1 },
    7: { label: 'Last 7 days', tokens: 48.2e6, cost: 58.4, sessions: 19, messages: 212, edits: 148, projects: 3, time: '17h 05m', models: [['opus', 30.1e6, 44.9], ['sonnet', 15.8e6, 12.8], ['haiku', 2.3e6, 0.7]], days: 7 },
    30: { label: 'Last 30 days', tokens: 171.5e6, cost: 214.6, sessions: 74, messages: 860, edits: 591, projects: 5, time: '61h 20m', models: [['opus', 99.5e6, 158.2], ['sonnet', 61.7e6, 53.1], ['haiku', 10.3e6, 3.3]], days: 30 },
    0: { label: 'All time', tokens: 1.21e9, cost: 1486.3, sessions: 512, messages: 6120, edits: 4210, projects: 14, time: '402h', models: [['opus', 690e6, 1090], ['sonnet', 452e6, 381], ['haiku', 68e6, 15.3]], days: 30 },
  };
  const trend = (days, seed) => {
    const r = rng(seed);
    const out = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const weekend = d.getDay() === 0 || d.getDay() === 6;
      out.push([d, r() < (weekend ? 0.5 : 0.08) ? 0 : Math.round((weekend ? 2e6 : 4e6) + r() * 7e6)]);
    }
    return out;
  };

  // ---------------------------------------------------------------- state
  const S = {
    tab: 'chats', filter: 'all', source: 'all', q: '', archivedOpen: {}, collapsed: {},
    docs: [], active: null, split: null, splitMode: 'right-half',
    terms: [{ name: 'Fix the flaky login test', chat: '4f2a9c1e', cmd: 'claude --resume 4f2a9c1e', notes: [] },
      { name: 'Move nightly jobs to a queue', chat: '7b31d0aa', cmd: 'claude --resume 7b31d0aa', notes: [] }],
    termOpen: false, termActive: 0,
    leftover: { cmd: 'npm run dev', from: 'Dark mode for the docs', mb: 210, cpu: '0.4%' },
    range: 7, opts: { cost: true, tiles: true, models: true, chart: true, names: false },
    dDays: 7, dOff: 0, memOpen: null, memQ: '',
    segs: [{ key: 'c5', label: '5h', name: 'Claude · 5h', pct: 38, color: '#d97757', resetMin: 130 }, { key: 'c7', label: '7d', name: 'Claude · 7d', pct: 31, color: '#d97757', resetMin: 9 * 60 }],
    spare: [{ key: 'o7', label: 'Opus 7d', name: 'Opus · 7d', pct: 12, color: '#8b6fd4', resetMin: 9 * 60 }, { key: 'x5', label: 'Codex 5h', name: 'Codex · 5h', pct: 54, color: '#5b8dd9', resetMin: 220 }],
    cfg: { limitAlerts: false, resetSoonWeeklyHours: 12, resetSoonMinutes: 30, unusedPercent: 30, boardAllWindows: false, layout: 'right-half', sort: 'recent', showLiveFirst: true, pageSize: 8, resumeTarget: 'auto', skipPermissions: false, exportSourceCopy: true },
    alerted: false, dash: 'overview', dashDays: 30,
  };
  const chat = (id) => CHATS.find((c) => c.id === id);
  const SWATCHES = ['#7fb069', '#5b8dd9', '#d9a441', '#c96a6a', '#8b6fd4', '#4fa8a8', '#d97757', '#8a8a8a'];

  // ---------------------------------------------------------------- shell
  demo.innerHTML = `
    <div class="ed-act" aria-hidden="true">
      <span><svg viewBox="0 0 24 24"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg></span>
      <span><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg></span>
      <span><svg viewBox="0 0 24 24"><circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="7" r="2"/><path d="M6 7v10M18 9c0 5-12 3-12 8"/></svg></span>
      <span><svg viewBox="0 0 24 24"><rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><path d="M17.25 3v7.5M13.5 6.75H21"/></svg></span>
      <span class="on">${icon('logbook')}</span>
    </div>
    <aside class="lb" aria-label="Agent Logbook panel">
      <div class="lb-head"><span>Agent Logbook</span><button type="button" class="lb-ib" data-act="refresh" title="Refresh">${icon('reload')}</button></div>
      <div class="q" id="dq"></div>
      <div class="q-nudge" id="dnudge" hidden></div>
      <div class="lb-tabs" role="tablist" aria-label="Panel tabs">
        <button type="button" role="tab" class="lb-tab on" data-tab="chats" title="All chats" aria-selected="true">${icon('message')}</button>
        <button type="button" role="tab" class="lb-tab" data-tab="card" title="Shareable card" aria-selected="false">${icon('card')}</button>
        <button type="button" role="tab" class="lb-tab" data-tab="digest" title="Digest" aria-selected="false">${icon('calendar')}</button>
        <button type="button" role="tab" class="lb-tab" data-tab="memory" title="Memory" aria-selected="false">${icon('book')}</button>
        <button type="button" role="tab" class="lb-tab" data-tab="settings" title="Settings" aria-selected="false">${icon('gear')}</button>
        <span class="lb-gap"></span>
        <button type="button" class="lb-ib" data-act="board" title="Live chats: every running chat on one page">${icon('pulse')}</button>
        <button type="button" class="lb-ib" data-act="dash" title="Open the dashboard">${icon('chart')}</button>
        <button type="button" class="lb-ib" data-act="new" title="Start a new Claude session in a terminal">${icon('plus')}</button>
      </div>
      <div class="lb-view on" data-view="chats"></div>
      <div class="lb-view" data-view="card"></div>
      <div class="lb-view" data-view="digest"></div>
      <div class="lb-view" data-view="memory"></div>
      <div class="lb-view" data-view="settings"></div>
    </aside>
    <div class="main">
      <div class="etabs" id="detabs" role="tablist" aria-label="Open editors"></div>
      <div class="panes" id="dpanes"></div>
      <div class="term" id="dterm" hidden></div>
      <div class="toast" id="dtoast" role="status" hidden></div>
    </div>
    <div class="ctx" id="dctx" role="menu" hidden></div>`;
  const status = stage.querySelector('.ed-status');

  // ---------------------------------------------------------------- phones
  // A phone can't fit the panel, the chat and the terminal together, so it shows one at a
  // time and slides to wherever the action is. The visitor watches; the cursor drives.
  const phone = matchMedia('(max-width: 700px)');
  const edTop = stage.querySelector('.ed-top');
  edTop.insertAdjacentHTML('beforeend', '<div class="mnav" aria-hidden="true"><span data-v="side">Panel</span><span data-v="main">Editor</span><span data-v="term">Terminal</span></div>');
  const setView = (v) => {
    demo.dataset.mview = v;
    edTop.querySelectorAll('.mnav span').forEach((x) => x.classList.toggle('on', x.dataset.v === v));
  };
  const viewOf = (el) => (el.closest('.lb') ? 'side' : el.closest('#dterm') ? 'term' : 'main');
  const lockForPhone = () => {
    stage.classList.toggle('locked', phone.matches);
    if (phone.matches) demo.setAttribute('aria-hidden', 'true'); else demo.removeAttribute('aria-hidden');
  };
  lockForPhone();

  let toastTimer = null;
  const toast = (msg) => {
    const t = $('#dtoast');
    t.innerHTML = msg; t.hidden = false;
    t.classList.remove('in'); void t.offsetWidth; t.classList.add('in');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
  };

  // ---------------------------------------------------------------- quota bars + use it or lose it
  const span = (min) => (min >= 60 ? `${Math.floor(min / 60)}h${min % 60 ? ' ' + (min % 60) + 'm' : ''}` : `${min}m`);
  const flagged = () => S.segs.filter((s) => {
    const left = 100 - s.pct;
    const soon = s.label.includes('7d') ? s.resetMin <= S.cfg.resetSoonWeeklyHours * 60 : s.resetMin <= S.cfg.resetSoonMinutes;
    return soon && left >= S.cfg.unusedPercent;
  });
  const drawQuota = () => {
    const hit = flagged();
    $('#dq').innerHTML = S.segs.map((s) => `<div class="q-row${hit.includes(s) ? ' flag' : ''}" title="${esc(s.name)} · resets in ${span(s.resetMin)}"><b>${esc(s.label)}</b><span class="q-bar"><i style="width:${s.pct}%;background:${s.color}"></i></span><em>${s.pct}%</em></div>`).join('');
    const n = $('#dnudge');
    n.hidden = !hit.length;
    if (hit.length) n.innerHTML = `${icon('flag')}<span>${esc(hit[0].label)} resets in ${span(hit[0].resetMin)} with ${100 - hit[0].pct}% left</span><button type="button" class="q-x" aria-label="Dismiss">${icon('close')}</button>`;
    if (status) {
      const right = status.querySelector('.st-quota');
      right.hidden = !hit.length;
      if (hit.length) right.innerHTML = `${icon('clock')}${esc(hit[0].name.replace(' · ', ' '))} ${100 - hit[0].pct}% unused · resets ${span(hit[0].resetMin)}`;
    }
    if (hit.length && S.cfg.limitAlerts && !S.alerted) { S.alerted = true; toast(`${icon('bell')} ${esc(hit[0].name)}: ${100 - hit[0].pct}% still unused, resets in ${span(hit[0].resetMin)}`); }
  };
  demo.addEventListener('click', (e) => { if (e.target.closest('.q-x')) $('#dnudge').hidden = true; });

  // ---------------------------------------------------------------- chats view
  const ago = (m) => (m < 60 ? `${m}m` : m < 60 * 24 ? `${Math.round(m / 60)}h` : `${Math.round(m / 1440)}d`);
  const visible = (c) => !c.trashed &&
    (S.source === 'all' || c.src === S.source) &&
    (S.filter === 'all' || (S.filter === 'pinned' ? c.pinned : c.group === S.filter)) &&
    (!S.q || `${c.title} ${c.folder} ${c.words || ''} ${c.blocks.map((b) => b.text || '').join(' ')}`.toLowerCase().includes(S.q));
  const order = (a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (S.cfg.showLiveFirst && !!a.live !== !!b.live) return a.live ? -1 : 1;
    if (S.cfg.sort === 'cost') return b.cost - a.cost;
    if (S.cfg.sort === 'messages') return b.msgs - a.msgs;
    if (S.cfg.sort === 'title') return a.title.localeCompare(b.title);
    return a.ago - b.ago;
  };
  const SRC = { all: ['All sources', ''], claude: ['Claude Code', icon('sparkle', 'spark')], codex: ['Codex', '<i class="codex-mark"></i>'] };
  const drawChats = () => {
    const v = $('[data-view="chats"]');
    const focusQ = document.activeElement && document.activeElement.id === 'dq-in';
    const groups = [...new Set(CHATS.filter((c) => c.group).map((c) => c.group))];
    const pins = CHATS.filter((c) => c.pinned && !c.trashed).length;
    const chips = [['all', 'All'], ...(pins ? [['pinned', `Pinned · ${pins}`]] : []), ...groups.map((g) => [g, g])];
    if (!chips.some(([k]) => k === S.filter)) S.filter = 'all';
    const folders = [...new Set(CHATS.map((c) => c.folder))];
    let list = '';
    let shown = 0;
    for (const f of folders) {
      const all = CHATS.filter((c) => c.folder === f && visible(c)).sort(order);
      const live = all.filter((c) => !c.archived);
      const arch = all.filter((c) => c.archived);
      if (!all.length) continue;
      const open = !S.collapsed[f];
      list += `<button type="button" class="lb-group" data-folder="${esc(f)}" aria-expanded="${open}">${icon('chevron', 'chev')}<span>${esc(f)}</span><span>${live.length}</span></button>`;
      if (!open) continue;
      const rows = S.archivedOpen[f] ? [...live, ...arch] : live;
      rows.slice(0, S.cfg.pageSize).forEach((c) => {
        shown++;
        const on = S.active === 'chat:' + c.id ? ' on' : '';
        list += `<div class="lb-row${on}${c.archived ? ' archived' : ''}" data-id="${c.id}">
          <button type="button" class="lb-open" data-open="${c.id}"><i class="dot ${c.live}"></i><strong>${c.pinned ? icon('pin', 'pin') : ''}<span class="t">${esc(c.title)}</span>${c.src === 'codex' ? '<span class="src">codex</span>' : ''}</strong><small>${c.live ? `<span class="res" title="Memory used by this chat and everything it started">${c.mem}</span>` : ago(c.ago)} · ${money(c.cost)}</small></button>
          <button type="button" class="lb-more" data-more="${c.id}" aria-label="More actions for ${esc(c.title)}">${icon('dots')}</button></div>`;
      });
      if (rows.length > S.cfg.pageSize) list += `<p class="lb-note">${rows.length - S.cfg.pageSize} more · <button type="button" class="lnk" data-more-page>Show more</button></p>`;
      if (arch.length) list += `<p class="lb-note">${arch.length} archived · <button type="button" class="lnk" data-arch="${esc(f)}">${S.archivedOpen[f] ? 'hide' : 'show'}</button></p>`;
    }
    const lo = S.leftover;
    v.innerHTML = `
      ${lo ? `<div class="leftover">${icon('terminal')}<span><b>${esc(lo.cmd)}</b> is still running from an ended chat · ${lo.mb} MB</span><button type="button" class="lnk" data-stop>Stop</button></div>` : ''}
      <div class="chips">${chips.map(([k, l]) => `<button type="button" class="chip${S.filter === k ? ' on' : ''}" data-chip="${esc(k)}">${esc(l)}</button>`).join('')}</div>
      <div class="findrow">
        <label class="lb-search">${icon('search')}<input id="dq-in" type="search" placeholder="Search chats, folders or messages…" aria-label="Search the demo chats" autocomplete="off" value="${esc(S.q)}"></label>
        <button type="button" class="srcbtn" data-src title="Showing: ${SRC[S.source][0]}" aria-label="Source filter: ${SRC[S.source][0]}">${S.source === 'all' ? icon('list') : SRC[S.source][1]}</button>
      </div>
      <div class="lb-list">${list || ''}${shown ? '' : `<p class="lb-empty">${S.q ? 'No chats match.' : 'Nothing here.'}</p>`}</div>`;
    if (focusQ) { const i = $('#dq-in'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
  };

  // ---------------------------------------------------------------- the shareable card (a port of cardImage)
  let cardURL = null;
  const cardImage = () => {
    const s = RANGES[S.range], O = S.opts;
    const W = 1200, H = 675, R = 2;
    const c = document.createElement('canvas');
    c.width = W * R; c.height = H * R;
    const x = c.getContext('2d');
    x.scale(R, R);
    const F = 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
    const M = 'ui-monospace, SFMono-Regular, Menlo, monospace';
    const INK = '#f6f2ef', DIM = '#9a9086', CLAY = '#d97757', TEAL = '#7fb069';
    const round = (px, py, w, h, r) => { x.beginPath(); x.moveTo(px + r, py); x.arcTo(px + w, py, px + w, py + h, r); x.arcTo(px + w, py + h, px, py + h, r); x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r); x.closePath(); };
    const text = (t, px, py, { size = 14, weight = 400, fill = INK, font = F, align = 'left' } = {}) => { x.fillStyle = fill; x.font = `${weight} ${size}px ${font}`; x.textAlign = align; x.fillText(t, px, py); x.textAlign = 'left'; return x.measureText(t).width; };
    const bg = x.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#15100e'); bg.addColorStop(1, '#241a16');
    x.fillStyle = bg; x.fillRect(0, 0, W, H);
    const glow = x.createRadialGradient(300, 210, 20, 300, 210, 480); glow.addColorStop(0, 'rgba(217,119,87,.22)'); glow.addColorStop(1, 'rgba(217,119,87,0)');
    x.fillStyle = glow; x.fillRect(0, 0, W, H);
    x.strokeStyle = 'rgba(255,255,255,.035)'; x.lineWidth = 1;
    for (let gx = 60; gx < W; gx += 60) { x.beginPath(); x.moveTo(gx, 0); x.lineTo(gx, H); x.stroke(); }
    for (let gy = 60; gy < H; gy += 60) { x.beginPath(); x.moveTo(0, gy); x.lineTo(W, gy); x.stroke(); }
    const P = 64;
    text(s.label.toUpperCase() + ' IN CLAUDE CODE', P, 96, { size: 14, weight: 700, fill: CLAY });
    text(new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }), W - P, 96, { size: 14, fill: DIM, align: 'right' });
    const bw = text(nfmt(s.tokens), P, 196, { size: 88, weight: 800 });
    text('tokens', P + bw + 16, 196, { size: 24, weight: 500, fill: DIM });
    if (O.cost) { const cw = text(money(s.cost), P, 242, { size: 30, weight: 700, fill: TEAL }); text('at API prices', P + cw + 12, 242, { size: 15, fill: DIM }); }
    text(O.names ? 'BILLING-API' : `${s.projects} PROJECT${s.projects === 1 ? '' : 'S'}`, P, 272, { size: 12, weight: 700, fill: DIM });
    if (O.models) {
      const pw = 400, ph = 44 + s.models.length * 30, px0 = W - P - pw, py0 = 128;
      x.fillStyle = 'rgba(217,119,87,.09)'; round(px0, py0, pw, ph, 14); x.fill();
      x.strokeStyle = 'rgba(217,119,87,.38)'; round(px0, py0, pw, ph, 14); x.stroke();
      text('BY MODEL', px0 + 20, py0 + 28, { size: 11, weight: 700, fill: CLAY });
      text('TOKENS', px0 + pw - 120, py0 + 28, { size: 11, weight: 700, fill: DIM, align: 'right' });
      text('API PRICE', px0 + pw - 20, py0 + 28, { size: 11, weight: 700, fill: DIM, align: 'right' });
      s.models.forEach(([n, t, cst], i) => {
        const ry = py0 + 56 + i * 30;
        text(n, px0 + 20, ry, { size: 15, weight: 600 });
        text(nfmt(t), px0 + pw - 120, ry, { size: 15, font: M, align: 'right' });
        text(money(cst), px0 + pw - 20, ry, { size: 15, font: M, fill: TEAL, align: 'right' });
      });
    }
    if (O.tiles) {
      const tiles = [['SESSIONS', s.sessions], ['MESSAGES SENT', s.messages], ['FILE EDITS', s.edits], ['PROJECTS', s.projects], ['TIME SPENT', s.time]];
      const tw = (W - P * 2 - 4 * 16) / 5;
      tiles.forEach(([k, v], i) => {
        const tx = P + i * (tw + 16);
        x.fillStyle = 'rgba(255,255,255,.045)'; round(tx, 296, tw, 96, 12); x.fill();
        x.strokeStyle = 'rgba(255,255,255,.07)'; round(tx, 296, tw, 96, 12); x.stroke();
        text(String(v), tx + 18, 348, { size: 32, weight: 700 });
        text(k, tx + 18, 372, { size: 11, weight: 700, fill: DIM });
      });
    }
    if (O.chart) {
      const entries = trend(s.days, S.range + 3);
      const peak = Math.max(1, ...entries.map(([, v]) => v));
      text(`TOKENS PER DAY · ${entries.length} DAY${entries.length === 1 ? '' : 'S'}`, P, 432, { size: 11, weight: 700, fill: DIM });
      text(`${entries.filter(([, v]) => v).length} ACTIVE · PEAK ${nfmt(peak)} · TODAY IN GREEN`, W - P, 432, { size: 11, weight: 700, fill: DIM, align: 'right' });
      const top = 462, floor = 584, gw = (W - P * 2) / entries.length, wide = gw > 46;
      entries.forEach(([d, v], i) => {
        const bx = P + i * gw + 3, bwid = Math.max(2, Math.min(gw - 8, 160)), today = i === entries.length - 1;
        if (v) {
          const h = Math.max(5, v / peak * (floor - top));
          x.fillStyle = today ? TEAL : 'rgba(217,119,87,.72)'; round(bx, floor - h, bwid, h, 4); x.fill();
          if (wide) text(nfmt(v), bx + bwid / 2, floor - h - 9, { size: 12, weight: 700, fill: today ? TEAL : INK, align: 'center' });
        } else { x.fillStyle = 'rgba(255,255,255,.06)'; round(bx, floor - 4, bwid, 4, 2); x.fill(); }
        if (wide) {
          text(d.toLocaleDateString(undefined, { weekday: 'short' }), bx + bwid / 2, floor + 20, { size: 12, fill: today ? INK : DIM, weight: today ? 700 : 400, align: 'center' });
          text(d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }), bx + bwid / 2, floor + 36, { size: 10.5, fill: 'rgba(139,147,167,.6)', align: 'center' });
        }
      });
    }
    x.fillStyle = 'rgba(255,255,255,.08)'; x.fillRect(P, 634, W - P * 2, 1);
    text('Agent Logbook', P, 659, { size: 13, weight: 700, fill: DIM });
    text('sample card from the website demo · made-up numbers', W - P, 659, { size: 12, fill: DIM, align: 'right' });
    return c;
  };
  const drawCard = () => {
    const v = $('[data-view="card"]');
    const opt = (k, name, sub) => `<label class="opt"><span class="oname">${name}</span><em>${sub}</em><input type="checkbox" data-opt="${k}"${S.opts[k] ? ' checked' : ''}><i class="sw"></i></label>`;
    const s = RANGES[S.range];
    v.innerHTML = `
      <div class="seg" role="group" aria-label="Range">${[[1, 'Today'], [7, '7d'], [30, '30d'], [0, 'All']].map(([d, l]) => `<button type="button" data-range="${d}" class="${S.range === d ? 'on' : ''}" aria-pressed="${S.range === d}">${l}</button>`).join('')}</div>
      <div class="preview"><img id="dcard" alt="Your usage card: ${nfmt(s.tokens)} tokens, ${money(s.cost)} at API prices"></div>
      <p class="opth">On the card</p>
      <div class="opts">
        ${opt('cost', 'Cost at API prices', money(s.cost))}
        ${opt('tiles', 'Sessions, messages, edits, time', 'The five small tiles')}
        ${opt('models', 'Models used', s.models.map((m) => m[0]).join(', '))}
        ${opt('chart', 'Tokens per day', `${s.days} day${s.days === 1 ? '' : 's'}`)}
        ${opt('names', 'Project name', S.opts.names ? 'Shown on the card' : 'Hidden - the card names no project')}
      </div>
      <div class="cardbtns"><button type="button" data-card="copy">${icon('copy')}<span>Copy image</span></button><button type="button" data-card="save">${icon('export')}<span>Save PNG…</span></button></div>
      <p class="cardnote">Copy it to paste straight into a post, or save it as a PNG. This one is a sample with made-up numbers.</p>`;
    const paint = () => { const c = cardImage(); cardURL = c.toDataURL('image/png'); $('#dcard').src = cardURL; $('#dcard')._canvas = c; };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(paint); else paint();
  };
  const saveCard = () => {
    const a = document.createElement('a');
    a.href = cardURL; a.download = `agent-logbook-sample-${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(a); a.click(); a.remove();
    toast('Saved the sample card as a PNG');
  };
  const copyCard = () => {
    const c = $('#dcard')._canvas;
    if (!c || !navigator.clipboard || !window.ClipboardItem) { saveCard(); return; }
    c.toBlob((blob) => navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      .then(() => toast('Card copied. Paste it into a post or a chat.'))
      .catch(() => saveCard()));
  };

  // ---------------------------------------------------------------- digest
  const DAYNAME = { 1: 'Today', 7: 'Last 7 days', 30: 'Last 30 days' };
  const drawDigest = () => {
    const v = $('[data-view="digest"]');
    const r = rng(S.dDays * 31 + S.dOff * 7 + 1);
    const days = trend(S.dDays, S.dDays * 13 + S.dOff);
    const scale = S.dDays === 1 ? 0.14 : S.dDays === 7 ? 1 : 3.6;
    const num = (base) => Math.round(base * scale * (0.8 + r() * 0.4));
    const t = { sessions: num(19), tokens: num(48e6), cost: num(5840) / 100, edits: num(148), active: num(1025) };
    const p = { sessions: num(19), tokens: num(48e6), cost: num(5840) / 100, edits: num(148), active: num(1025) };
    const delta = (a, b) => { const d = Math.round((a - b) / Math.max(1, b) * 100); return d ? `<em class="${d > 0 ? 'rise' : 'fall'}">${d > 0 ? '▲' : '▼'} ${Math.abs(d)}%</em>` : ''; };
    const dur = (m) => `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
    const active = days.filter(([, n]) => n).length;
    const peak = Math.max(1, ...days.map(([, n]) => n));
    const best = days.reduce((a, b) => (b[1] > a[1] ? b : a));
    const name = S.dOff === 0 ? DAYNAME[S.dDays] : `${S.dOff} ${({ 1: 'day', 7: 'week', 30: 'month' })[S.dDays]}${S.dOff === 1 ? '' : 's'} ago`;
    const fmt = (d) => d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    const hours = Array.from({ length: 24 }, (_, h) => (h >= 9 && h <= 19 ? Math.round(r() * 40 + (h === 11 || h === 15 ? 30 : 0)) : h >= 21 || h <= 1 ? Math.round(r() * 14) : 0));
    const hpeak = Math.max(...hours);
    const busiest = hours.indexOf(hpeak);
    const hr = (h) => `${(h % 12) || 12}${h < 12 ? 'am' : 'pm'}`;
    const models = [['opus', 0.58], ['sonnet', 0.36], ['haiku', 0.06]];
    v.innerHTML = `
      <div class="seg" role="group" aria-label="Range">${[[1, 'Today'], [7, '7 days'], [30, '30 days']].map(([d, l]) => `<button type="button" data-ddays="${d}" class="${S.dDays === d ? 'on' : ''}" aria-pressed="${S.dDays === d}">${l}</button>`).join('')}</div>
      <div class="dnav"><button type="button" class="lb-ib" data-doff="1" title="Earlier">‹</button><div><h4>${name}</h4><p>${S.dDays === 1 ? fmt(days[0][0]) : `${fmt(days[0][0])} – ${fmt(days[days.length - 1][0])}`}</p></div><button type="button" class="lb-ib" data-doff="-1" title="Later"${S.dOff ? '' : ' disabled'}>›</button></div>
      <div class="dgrid">
        <div><b>${t.sessions}</b><span>SESSIONS</span>${delta(t.sessions, p.sessions)}</div>
        <div><b>${nfmt(t.tokens)}</b><span>TOKENS</span>${delta(t.tokens, p.tokens)}</div>
        <div><b>${money(t.cost)}</b><span>COST</span>${delta(t.cost, p.cost)}</div>
        <div><b>${t.edits}</b><span>EDITS</span>${delta(t.edits, p.edits)}</div>
        <div><b>${dur(t.active)}</b><span>ACTIVE TIME</span>${delta(t.active, p.active)}</div>
        <div><b>${active}/${days.length}</b><span>ACTIVE DAYS</span></div>
      </div>
      <p class="dnote">${best[0].toLocaleDateString(undefined, { weekday: 'long' })} was your heaviest day at ${nfmt(best[1])} tokens. You worked on ${active} of ${days.length} days. Spend is ${t.cost >= p.cost ? 'up' : 'down'} ${Math.abs(Math.round((t.cost - p.cost) / p.cost * 100))}% on the period before.</p>
      <div class="dsec"><b>Day by day</b><span>tokens · peak ${nfmt(peak)}</span></div>
      <div class="ddays${days.length > 10 ? ' many' : ''}">${days.map(([d, n], i) => `<button type="button" class="dday${i === days.length - 1 && !S.dOff ? ' today' : ''}${n ? '' : ' idle'}" data-day="${i}" title="${d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })} · ${n ? nfmt(n) + ' tokens' : 'nothing'}"><span class="dbox">${n ? `<i style="height:${Math.max(3, n / peak * 100)}%"></i>` : ''}</span>${days.length <= 10 ? `<span>${d.toLocaleDateString(undefined, { weekday: 'short' })}</span>` : ''}</button>`).join('')}</div>
      <div class="dpanel" id="dpanel"></div>
      <div class="dsec"><b>Streak</b></div>
      <div class="dstreak"><div><b>6</b><span>current run</span><em>days in a row</em></div><div><b>23</b><span>best run</span><em>days in a row</em></div><div><b>141</b><span>days ever</span><em>with any usage</em></div></div>
      <div class="dsec"><b>When you worked</b><span>busiest around ${hr(busiest)}</span></div>
      <div class="dhours">${hours.map((n, h) => `<div class="dhour${n ? '' : ' idle'}" title="${hr(h)} · ${n ? n + ' messages' : 'nothing'}"><i style="height:${n ? Math.max(8, n / hpeak * 100) : 0}%"></i>${h % 6 === 0 ? `<span>${hr(h)}</span>` : ''}</div>`).join('')}</div>
      <div class="dsec"><b>By model</b></div>
      ${models.map(([m, f]) => `<div class="dmodel"><div><b>${m}</b><span>${nfmt(t.tokens * f)} · ${money(t.cost * (m === 'opus' ? 0.76 : m === 'sonnet' ? 0.22 : 0.02))}</span></div><span class="dmbar"><i style="width:${f * 100}%"></i></span><p>${Math.round(f * 100)}% of tokens</p></div>`).join('')}
      <div class="dsec"><b>Top projects</b></div>
      ${[['billing-api', 0.52], ['marketing-site', 0.31], ['mobile-app', 0.17]].map(([n, f], i) => `<div class="dproj"><span class="rank">${i + 1}</span><span class="pname">${n}</span><span class="pmeta">${Math.max(1, Math.round(t.sessions * f))} sessions · ${nfmt(t.tokens * f)}</span><span class="pcost">${money(t.cost * f)}</span></div>`).join('')}`;
    v._days = days;
  };
  const showDay = (i) => {
    const [d, n] = $('[data-view="digest"]')._days[i];
    $('#dpanel').innerHTML = n
      ? `<b>${d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</b><span>${nfmt(n)} tokens · ${money(n / 1e6 * 1.21)} · ${Math.max(1, Math.round(n / 2.6e6))} sessions</span>`
      : `<b>${d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</b><span>No usage that day.</span>`;
  };

  // ---------------------------------------------------------------- memory
  const drawMemory = () => {
    const v = $('[data-view="memory"]');
    if (S.memOpen != null) {
      const m = MEMORIES[S.memOpen];
      const body = esc(m.body).replace(/^# (.*)$/gm, '<b class="mh">$1</b>').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/^- (.*)$/gm, '<span class="mli">$1</span>').replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
      v.innerHTML = `<div class="memread"><button type="button" class="lnk back" data-memback>${icon('back')}Memory</button><div class="memtop">${m.provider === 'codex' ? '<i class="codex-mark"></i>' : icon('sparkle', 'spark')}<b>${esc(m.title)}</b>${m.type ? `<span class="memtype ${m.type}">${m.type.toUpperCase()}</span>` : ''}</div><p class="mempath">${esc(m.path || `~/.claude/projects/${m.project}/memory/${slug(m.title)}.md`)} · ${m.ago} ago</p><div class="membody">${body}</div></div>`;
      return;
    }
    const q = S.memQ.toLowerCase();
    const list = MEMORIES.map((m, i) => [m, i]).filter(([m]) => !q || `${m.title} ${m.desc} ${m.body} ${m.project}`.toLowerCase().includes(q));
    const byProject = new Map();
    for (const it of list) { if (!byProject.has(it[0].project)) byProject.set(it[0].project, []); byProject.get(it[0].project).push(it); }
    const focus = document.activeElement && document.activeElement.id === 'dmem-in';
    v.innerHTML = `<p class="lb-meta">${list.length} ${list.length === 1 ? 'memory' : 'memories'} written by agents on this machine</p>
      <label class="lb-search">${icon('search')}<input id="dmem-in" type="search" placeholder="Search memories…" aria-label="Search memories" autocomplete="off" value="${esc(S.memQ)}"></label>
      <div class="lb-list">${[...byProject].map(([p, items]) => `<div class="lb-group static">${icon('folder', 'chev')}<span>${esc(p)}</span><span>${items.length}</span></div>` +
        items.map(([m, i]) => `<button type="button" class="memcard${m.index ? ' isindex' : ''}" data-mem="${i}"><span class="memtop">${m.provider === 'codex' ? '<i class="codex-mark"></i>' : icon('sparkle', 'spark')}${m.index ? icon('list', 'memico') : ''}<b>${esc(m.title)}</b>${m.type ? `<span class="memtype ${m.type}">${m.type.toUpperCase()}</span>` : ''}</span><span class="memdesc">${esc(m.desc)}</span><span class="memwhen">${m.ago} ago</span></button>`).join('')).join('') || `<p class="lb-empty">No memory matches that.</p>`}</div>`;
    if (focus) { const i = $('#dmem-in'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
  };

  // ---------------------------------------------------------------- settings
  const LAYOUTS = {
    'right-half': { cols: 2, rows: 1, cells: [[1, 1, 1, 1, 0], [2, 1, 1, 1, 1]], name: 'Right half' },
    'right-third': { cols: 3, rows: 1, cells: [[1, 1, 2, 1, 0], [3, 1, 1, 1, 1]], name: 'Right third' },
    'right-two-thirds': { cols: 3, rows: 1, cells: [[1, 1, 1, 1, 0], [2, 1, 2, 1, 1]], name: 'Right two thirds' },
    'bottom-half': { cols: 1, rows: 2, cells: [[1, 1, 1, 1, 0], [1, 2, 1, 1, 1]], name: 'Bottom half' },
    'right-stack': { cols: 2, rows: 2, cells: [[1, 1, 1, 2, 0], [2, 1, 1, 1, 1], [2, 2, 1, 1, 1]], name: 'Right stack' },
    grid: { cols: 2, rows: 2, cells: [[1, 1, 1, 1, 0], [2, 1, 1, 1, 1], [1, 2, 1, 1, 1], [2, 2, 1, 1, 1]], name: 'Grid of four' },
  };
  const drawSettings = () => {
    const v = $('[data-view="settings"]');
    const C = S.cfg;
    const section = (ic, title, sub, body) => `<div class="set">${icon(ic, 'seticon')}<div><h4>${title}</h4><p class="setsub">${sub}</p>${body}</div></div>`;
    const toggle = (k, label, note) => `<label class="opt"><span class="oname">${label}</span><em>${note}</em><input type="checkbox" data-cfg="${k}"${C[k] ? ' checked' : ''}><i class="sw"></i></label>`;
    const number = (k, label, note, min, max) => `<label class="opt num"><span class="oname">${label}</span><em>${note}</em><input type="number" data-cfg="${k}" value="${C[k]}" min="${min}" max="${max}"></label>`;
    const pick = (k, label, note, options) => `<label class="opt num"><span class="oname">${label}</span><em>${note}</em><select data-cfg="${k}">${options.map(([val, l]) => `<option value="${val}"${C[k] === val ? ' selected' : ''}>${l}</option>`).join('')}</select></label>`;
    const segs = S.segs.map((s, i) => `<div class="segrow"><b>${esc(s.name)}</b><span class="swatches">${SWATCHES.map((c) => `<button type="button" style="background:${c}" data-seg="${i}" data-color="${c}" aria-label="Colour ${c}" aria-pressed="${s.color === c}"></button>`).join('')}</span><button type="button" class="lb-ib" data-segrm="${i}" title="Remove this segment"${S.segs.length < 2 ? ' disabled' : ''}>${icon('close')}</button></div>`).join('');
    v.innerHTML = `<div class="sets">
      ${section('chart', 'Quota bars', 'The bars across the top of the panel.', `<span class="seclabel">Segments</span>${segs}${S.spare.length ? `<button type="button" class="lnk add" data-segadd>${icon('plus')}Add a segment</button>` : ''}`)}
      ${section('bell', 'Use it or lose it', 'Flags a quota bar you chose when it is about to reset with a lot left, or is on course to run out first - under the bars, on the live board and in the status bar.',
        toggle('limitAlerts', 'Also pop up a notification', 'once per window - the flag already shows here and in the status bar') +
        number('resetSoonWeeklyHours', 'Weekly reset counts as soon', 'hours before it resets', 1, 72) +
        number('resetSoonMinutes', '5-hour reset counts as soon', 'minutes before it resets', 5, 240) +
        number('unusedPercent', 'Flag it when this much is left', 'percent unused', 5, 95))}
      ${section('pulse', 'Live chats', 'The board of running chats, opened from the pulse icon.', toggle('boardAllWindows', 'Chats from every window', 'off: only the chats running in this window'))}
      ${section('layout', 'Chat layout', 'Where a chat opens when you resume it or start a new one. Click one to make it the default.',
        `<div class="layouts">${Object.entries(LAYOUTS).map(([k, l]) => `<button type="button" class="lay${C.layout === k ? ' on' : ''}" data-layout="${k}" title="${C.layout === k ? 'Current default' : 'Use this for every chat'}"><span class="laygrid" style="grid-template-columns:repeat(${l.cols},1fr);grid-template-rows:repeat(${l.rows},1fr)">${l.cells.map(([c, r, w, h, chat]) => `<i class="${chat ? 'chat' : ''}" style="grid-column:${c}/span ${w};grid-row:${r}/span ${h}"></i>`).join('')}</span><span>${l.name}</span></button>`).join('')}</div>`)}
      ${section('list', 'The chat list', 'How chats are ordered and shown.',
        pick('sort', 'Order chats by', 'inside each folder', [['recent', 'Most recent'], ['cost', 'Most expensive'], ['messages', 'Most messages'], ['title', 'Title']]) +
        toggle('showLiveFirst', 'Running chats first', 'at the top of each folder') +
        number('pageSize', 'Chats per folder', 'before "Show more"', 1, 50))}
      ${section('play', 'Resuming', 'Where a chat reopens when you pick it up again.',
        pick('resumeTarget', 'Resume opens in', 'Codex chats always go to a terminal', [['auto', 'Where the chat started'], ['terminal', 'A terminal in the editor'], ['claude', 'The Claude Code extension'], ['desktop', 'Claude Desktop']]) +
        toggle('skipPermissions', 'Skip permission prompts', 'adds --dangerously-skip-permissions'))}
      ${section('export', 'Exporting', 'What a saved copy of a chat contains.', toggle('exportSourceCopy', 'Also write the raw transcript', 'a .source.jsonl next to the Markdown'))}
    </div>`;
  };

  // ---------------------------------------------------------------- the editor area
  const blockHTML = (c, b) => {
    if (b.t === 'you') return `<p class="msg you">${esc(b.text)}</p>`;
    if (b.t === 'ai') return `<p class="msg">${esc(b.text)}</p>`;
    if (b.t === 'tool') return `<button type="button" class="tool${b.open ? ' open' : ''}" data-fold="${c.id}:${c.blocks.indexOf(b)}" aria-expanded="${!!b.open}">${esc(b.text)}</button>${b.open ? `<div class="calls">${b.calls.map(([k, a, o]) => `<p><b>${k}</b><code>${esc(a)}</code>${o ? `<span>${esc(o)}</span>` : ''}</p>`).join('')}</div>` : ''}`;
    if (b.t === 'diff') return `<button type="button" class="diff" data-diff="${esc(b.file)}" title="Open in the diff view"><header><span>${esc(b.file)}</span><em><span class="p">+${b.add}</span> <span class="m">−${b.del}</span></em></header>${b.lines.map((l) => `<span class="${l[0] === '+' ? 'add' : 'del'}">${esc(l)}</span>`).join('')}</button>`;
    if (b.t === 'agent') return `<button type="button" class="agent-card" data-agent="${c.id}">${icon('agent')}<span><b>Agent · ${esc(c.agent.name)}</b><span>${esc(c.agent.report)}</span><small>${esc(c.agent.tools)} · ${money(c.agent.cost)} · open thread →</small></span></button>`;
    return '';
  };
  const footer = (c) => `<div class="chat-foot">${c.live === 'busy' ? runner() : ''}<span class="fgroup"><b>${c.src === 'codex' ? 'Codex' : 'Claude'}</b><span title="Context used">${c.ctx}</span><span title="Prompt cache hits">cache ${c.cache}%</span><span title="At API prices">${money(c.cost)}</span></span>${c.live ? `<i></i><span class="fgroup"><b>Laptop</b><span>${c.mem}</span><span>${c.cpu} CPU</span></span>` : ''}${c.live === 'wait' ? '<span class="run wait"><i class="dot wait"></i>Waiting for you</span>' : ''}</div>`;
  const resumeLabel = { auto: 'Resume', terminal: 'Resume', claude: 'Resume in Claude Code', desktop: 'Resume in Desktop' };
  const chatDoc = (c, inSplit) => `
    <div class="dhead">
      <div class="dtitle"><b>${esc(c.title)}</b><span>${esc(c.folder)} · ${c.model} · ${c.msgs} messages · ${c.live ? (c.live === 'busy' ? 'working now' : 'waiting for you') : ago(c.ago) + ' ago'}</span></div>
      <div class="dacts">
        <button type="button" class="dbtn primary" data-resume="${c.id}">${icon('play')}<span>${c.src === 'codex' ? 'Resume' : resumeLabel[S.cfg.resumeTarget]}</span></button>
        ${c.src === 'codex' ? '' : `<button type="button" class="dbtn" data-branch="${c.id}" title="Branch: a new session carrying this chat's full context, like /branch">${icon('fork')}</button>
        <button type="button" class="dbtn" data-brief="${c.id}" title="Branch with a brief: a fresh session started from a written handover">${icon('brief')}</button>`}
        <button type="button" class="dbtn" data-analytics="${c.id}" title="Session analytics">${icon('chart')}</button>
        <button type="button" class="dbtn" data-export="${c.id}" title="Export as Markdown">${icon('export')}</button>
        ${inSplit ? `<button type="button" class="dbtn" data-unsplit title="Close this split">${icon('close')}</button>` : ''}
      </div>
    </div>
    <div class="chat-body">${c.blocks.length ? c.blocks.map((b) => blockHTML(c, b)).join('') : '<p class="msg none">No messages yet. Type in its terminal and they show up here as you send them.</p>'}</div>
    ${footer(c)}`;
  const bars = (vals, max, cls = '') => `<div class="minibars ${cls}">${vals.map((v) => `<i style="height:${Math.max(2, v / max * 100)}%"></i>`).join('')}</div>`;
  const DOCS = {
    chat: (id) => { const c = chat(id); return c ? { title: c.title, icon: 'logbook', html: chatDoc(c) } : null; },
    agent: (id) => {
      const c = chat(id), a = c.agent;
      return { title: `Agent · ${a.name}`, icon: 'agent', html: `<div class="dhead"><div class="dtitle"><b>${esc(a.name)}</b><span>Sub-agent of “${esc(c.title)}” · ${esc(a.tools)} · ${money(a.cost)}</span></div><div class="dacts"><button type="button" class="dbtn" data-open="${c.id}">${icon('back')}<span>Parent chat</span></button></div></div>
        <div class="chat-body"><p class="msg you"><b>Brief</b><br>${esc(a.brief)}</p><span class="tool">Read 9 files</span><span class="tool">Ran 2 commands</span><p class="msg"><b>Report</b><br>${esc(a.report)}</p></div>` };
    },
    board: () => {
      const live = [...CHATS.filter((c) => c.live && !c.trashed), ...(S.cfg.boardAllWindows ? [ELSEWHERE] : [])];
      const hit = flagged();
      return { title: 'Live chats', icon: 'pulse', html: `<div class="board-doc"><div class="bhead"><h3>Live chats</h3><span>${live.length} running · ${S.cfg.boardAllWindows ? 'every window' : 'this window'} · Laptop ${live.length ? '1.1 GB · 4% CPU' : 'idle'}</span></div>
        ${hit.length ? `<div class="q-flag sm">${icon('flag')}${esc(hit[0].name)} resets in ${span(hit[0].resetMin)} with ${100 - hit[0].pct}% left. Use it or lose it.</div>` : ''}
        <div class="bgrid">${live.map((c) => `<div class="bc ${c.live}"><div class="bc-top"><b>Claude</b><span>${esc(c.folder)}${c.other ? ' · other window' : ''}</span><em><i class="dot ${c.live}"></i>${c.live === 'busy' ? 'Working' : 'Waiting for you'}</em></div><div class="bc-body"><strong>${esc(c.title)}</strong><p><b>You:</b> ${esc(c.ask)}</p><p>${esc(c.reply)}</p><span class="bc-acts"><button type="button" class="bc-copy" data-copytext="${esc(c.reply)}">Copy</button>${c.other ? '' : `<button type="button" class="bc-copy" data-open="${c.id}">Open</button>`}</span></div></div>`).join('') || '<p class="lb-empty">No chats running.</p>'}</div></div>` };
    },
    dash: () => {
      const r = rng(99);
      const spend = Array.from({ length: S.dashDays }, () => Math.round(r() * 14 + (r() < 0.2 ? 0 : 2)));
      const heat = Array.from({ length: 52 * 7 }, () => { const x = r(); return x < 0.35 ? 0 : x < 0.6 ? 1 : x < 0.8 ? 2 : x < 0.93 ? 3 : 4; });
      const tabs = [['overview', 'Overview'], ['models', 'Models'], ['plan', 'Plan usage']];
      const body = S.dash === 'overview'
        ? `<div class="kpis"><div><span>Spend at API prices</span><b>${money(S.dashDays === 7 ? 58.4 : S.dashDays === 30 ? 214.6 : 1486.3)}</b></div><div><span>Tokens</span><b>${S.dashDays === 7 ? '48.2M' : S.dashDays === 30 ? '171.5M' : '1.2B'}</b></div><div><span>Sessions</span><b>${S.dashDays === 7 ? 19 : S.dashDays === 30 ? 74 : 512}</b></div><div><span>Cache hit rate</span><b>89%</b></div></div>
          <div class="dpanel2"><div class="phead"><b>Spend per day</b><span>${S.dashDays} days</span></div>${bars(spend, Math.max(...spend))}</div>
          <div class="dpanel2"><div class="phead"><b>A year of activity</b><span>tokens per day</span></div><div class="heat">${heat.map((l) => `<i class="l${l}"></i>`).join('')}</div></div>`
        : S.dash === 'models'
          ? `<div class="dpanel2"><div class="phead"><b>By model</b><span>tokens · API price</span></div>${[['opus', 58, 158.2], ['sonnet', 36, 53.1], ['haiku', 6, 3.3]].map(([m, f, c]) => `<div class="dmodel"><div><b>${m}</b><span>${f}% · ${money(c)}</span></div><span class="dmbar"><i style="width:${f}%"></i></span></div>`).join('')}</div>`
          : `<div class="dpanel2"><div class="phead"><b>Plan usage</b><span>right now</span></div>${[...S.segs, ...S.spare].map((s) => `<div class="qr"><span>${esc(s.name)}</span><span class="bar"><b style="width:${s.pct}%;background:${s.color}"></b></span><em>${s.pct}%</em></div>`).join('')}</div>`;
      return { title: 'Dashboard', icon: 'chart', html: `<div class="dash-doc"><div class="dash-top"><div><h3>Claude Code dashboard</h3><p>Read from the transcripts on this machine. Nothing is uploaded.</p></div><div class="seg">${[[7, '7 days'], [30, '30 days'], [0, 'All time']].map(([d, l]) => `<button type="button" data-dashdays="${d || 365}" class="${S.dashDays === (d || 365) ? 'on' : ''}">${l}</button>`).join('')}</div></div>
        <div class="dash-tabs">${tabs.map(([k, l]) => `<button type="button" data-dash="${k}" class="${S.dash === k ? 'on' : ''}">${l}</button>`).join('')}</div>${body}</div>` };
    },
    analytics: (id) => {
      const c = chat(id);
      const r = rng(c.msgs);
      const ctx = Array.from({ length: c.msgs }, (_, i) => Math.round(20 + i * (60 / c.msgs) + r() * 8));
      const tools = [['Read', Math.round(4 + r() * 10)], ['Bash', Math.round(2 + r() * 8)], ['Edit', Math.round(1 + r() * 7)], ['Grep', Math.round(r() * 5)]];
      const tmax = Math.max(...tools.map((t) => t[1]));
      return { title: `Analytics · ${c.title}`, icon: 'chart', html: `<div class="dash-doc"><div class="dash-top"><div><h3>Session analytics</h3><p>${esc(c.title)} · ${c.msgs} requests · ${money(c.cost)}</p></div></div>
        <div class="kpis"><div><span>Requests</span><b>${c.msgs}</b></div><div><span>Model</span><b>${c.model}</b></div><div><span>Cache hits</span><b>${c.cache}%</b></div><div><span>Context now</span><b>${c.ctx.split(' ')[0]}</b></div></div>
        <div class="dpanel2"><div class="phead"><b>Context size at each reply</b><span>thousand tokens</span></div>${bars(ctx, 100, 'ctx')}</div>
        <div class="dpanel2"><div class="phead"><b>Tools used</b><span>calls</span></div>${tools.map(([n, k]) => `<div class="dmodel"><div><b>${n}</b><span>${k}</span></div><span class="dmbar"><i style="width:${k / tmax * 100}%"></i></span></div>`).join('')}</div>
        <div class="dpanel2"><div class="phead"><b>Stop reasons</b></div><div class="chips"><span class="chip on">end_turn · ${c.msgs - 3}</span><span class="chip">tool_use · 3</span></div></div></div>` };
    },
    md: (id) => {
      const c = chat(id), f = slug(c.title);
      const md = [`# ${c.title}`, '', `${c.folder} · ${c.model} · ${c.msgs} messages · ${money(c.cost)}`, '', ...c.blocks.map((b) => (b.t === 'you' ? `**You:** ${b.text}` : b.t === 'ai' ? b.text : b.t === 'tool' ? `> ${b.text}` : b.t === 'diff' ? '```diff\n' + b.lines.join('\n') + '\n```' : b.t === 'agent' ? `> Agent · ${c.agent.name}: ${c.agent.report}` : '')).flatMap((l) => [l, ''])].join('\n');
      return { title: `${f}.md`, icon: 'export', html: `<div class="dhead"><div class="dtitle"><b>${f}.md</b><span>Saved to your export folder${S.cfg.exportSourceCopy ? `, with ${f}.source.jsonl next to it` : ''}</span></div></div><pre class="mdview">${esc(md)}</pre>` };
    },
    brief: (id) => {
      const c = chat(id), f = slug(c.title);
      return { title: `${f}.md`, icon: 'brief', html: `<div class="dhead"><div class="dtitle"><b>Brief · ${esc(c.title)}</b><span>~/.claude/chistory-briefs/${f}.md · written by claude -p from the old chat</span></div></div>
        <pre class="mdview"># Handover: ${esc(c.title)}\n\n## Where it stands\n${esc(c.reply)}\n\n## What was done\n${esc(c.blocks.filter((b) => b.t === 'ai').map((b) => '- ' + b.text).join('\n'))}\n\n## Files touched\n${esc(c.blocks.filter((b) => b.t === 'diff').map((b) => '- ' + b.file).join('\n') || '- none')}\n\n## Next\nPick up from the last question, then run the tests.</pre>` };
    },
    diff: (file) => ({ title: `${file} (diff)`, icon: 'open', html: (() => { const b = CHATS.flatMap((c) => c.blocks).find((x) => x.file === file); return `<div class="dhead"><div class="dtitle"><b>${esc(file)}</b><span>Before ↔ after, in the editor's own diff view</span></div></div><div class="diffview"><div><small>Before</small>${b.lines.filter((l) => l[0] === '-').map((l) => `<span class="del">${esc(l.slice(1))}</span>`).join('') || '<span class="none">(new lines only)</span>'}</div><div><small>After</small>${b.lines.filter((l) => l[0] === '+').map((l) => `<span class="add">${esc(l.slice(1))}</span>`).join('')}</div></div>`; })() }),
  };
  const docOf = (key) => { const i = key.indexOf(':'); const kind = i < 0 ? key : key.slice(0, i); return DOCS[kind](i < 0 ? null : key.slice(i + 1)); };
  const open = (key) => {
    if (!S.docs.includes(key)) S.docs.push(key);
    S.active = key;
    drawEditor(true);
    setView('main');
    if (key.startsWith('chat:')) drawChats();
  };
  const closeDoc = (key) => {
    const i = S.docs.indexOf(key);
    S.docs.splice(i, 1);
    if (S.active === key) S.active = S.docs[Math.max(0, i - 1)] || null;
    drawEditor(true); drawChats();
  };
  const drawEditor = (swap, follow) => {
    const keep = $$('#dpanes > .pane').map((x) => x.scrollTop);
    S.docs = S.docs.filter((k) => docOf(k));
    $('#detabs').innerHTML = S.docs.map((k) => { const d = docOf(k); return `<div class="etab${k === S.active ? ' on' : ''}"><button type="button" role="tab" aria-selected="${k === S.active}" data-tab-doc="${esc(k)}">${icon(d.icon)}<span>${esc(d.title)}</span></button><button type="button" class="x" data-close-doc="${esc(k)}" aria-label="Close ${esc(d.title)}">×</button></div>`; }).join('');
    const main = S.active ? docOf(S.active) : null;
    const split = S.split && chat(S.split) ? chat(S.split) : null;
    const mode = (LAYOUTS[S.splitMode] || LAYOUTS['right-half']);
    const panes = $('#dpanes');
    panes.className = 'panes' + (split ? ' split ' + (mode.rows > 1 && mode.cols === 1 ? 'stack' : S.splitMode) : '');
    panes.innerHTML = `<div class="pane${swap ? ' swap' : ''}">${main ? main.html : `<div class="empty-ed">${icon('logbook')}<p>Open a chat from the list</p></div>`}</div>${split ? `<div class="pane">${chatDoc(split, true)}</div>` : ''}`;
    $$('#dpanes > .pane').forEach((x, i) => { x.scrollTop = follow ? x.scrollHeight : swap ? 0 : (keep[i] || 0); });
  };

  // ---------------------------------------------------------------- terminals
  // A terminal running a chat draws it the way Claude Code does, from the same blocks as
  // the chat view: what you see in one is what you see in the other.
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
  const tui = (c, term) => {
    const banner = c.src === 'codex'
      ? `<div class="cc-banner codex"><b>&gt;_ OpenAI Codex</b><span>model: ${esc(c.model)}</span><span>directory: ~/code/${esc(c.folder)}</span></div>`
      : `<div class="cc-banner"><b><span class="cc-star">✻</span> Welcome to Claude Code!</b><span>/help for help, /status for your current setup</span><span>cwd: ~/code/${esc(c.folder)}</span></div>`;
    const call = (k, arg, out) => `<p class="cc-call"><i>⏺</i><span><b>${esc(k)}</b>(${esc(arg)})</span></p>${out ? `<p class="cc-out"><i>⎿</i>${esc(out)}</p>` : ''}`;
    const lines = c.blocks.map((b) => {
      if (b.t === 'you') return `<p class="cc-you">&gt; ${esc(b.text)}</p>`;
      if (b.t === 'ai') return `<p class="cc-ai"><i>⏺</i>${esc(b.text)}</p>`;
      if (b.t === 'tool') return b.calls.map(([k, a, o]) => call(k, a, o)).join('');
      if (b.t === 'diff') return call('Update', b.file, `Updated ${b.file} with ${plural(b.add, 'addition')}${b.del ? ` and ${plural(b.del, 'removal')}` : ''}`) +
        `<div class="cc-diff">${b.lines.map((l, i) => `<span class="${l[0] === '+' ? 'add' : 'del'}"><em>${12 + i}</em>${esc(l)}</span>`).join('')}</div>`;
      if (b.t === 'agent') return call('Task', c.agent.name, `Done (${c.agent.uses} tool uses · ${money(c.agent.cost)})`);
      return '';
    }).join('');
    const notes = term.notes.map((n) => `<p class="cc-you">&gt; ${esc(n)}</p>`).join('');
    const busy = c.live === 'busy';
    return `${banner}${lines}${notes}${busy ? '<p class="cc-work"><span class="cc-spin">✻</span> Working… <span>(esc to interrupt)</span></p>' : ''}
      <label class="cc-input"><span>&gt;</span><input data-cc="${c.id}" autocomplete="off" aria-label="Message ${c.src === 'codex' ? 'Codex' : 'Claude'} in this terminal" placeholder="${busy ? 'Claude is working…' : 'Type a message. It shows up in the chat view too.'}"${busy ? ' disabled' : ''}></label>
      <p class="cc-hint">? for shortcuts</p>`;
  };
  const drawTerm = () => {
    const t = $('#dterm');
    t.hidden = !S.termOpen;
    if (!S.termOpen) return;
    const focused = document.activeElement && document.activeElement.dataset && document.activeElement.dataset.cc;
    const typed = focused ? document.activeElement.value : '';
    const cur = S.terms[S.termActive];
    const c = chat(cur.chat);
    t.innerHTML = `<div class="term-tabs"><span class="term-h">Terminal</span>${S.terms.map((x, i) => `<button type="button" class="${i === S.termActive ? 'on' : ''}" data-term="${i}">${chat(x.chat) && chat(x.chat).src === 'codex' ? '<i class="codex-mark"></i>' : icon('sparkle', 'spark')}<span>${esc(x.name)}</span></button>`).join('')}<button type="button" class="lb-ib term-x" data-termclose aria-label="Close panel">${icon('close')}</button></div>
      <div class="term-body">${(cur.pre || []).map((l) => `<p class="dim">${esc(l)}</p>`).join('')}<p><b>$</b> ${esc(cur.cmd)}</p>${c ? tui(c, cur) : ''}</div>`;
    const body = t.querySelector('.term-body');
    body.scrollTop = body.scrollHeight;
    if (focused && c && focused === c.id) { const i = t.querySelector('[data-cc]'); if (i && !i.disabled) { i.value = typed; i.focus(); } }
  };
  const termFor = (id) => S.terms.findIndex((x) => x.chat === id);
  const newTerm = (name, chatId, cmd, pre) => { S.terms.push({ name, chat: chatId, cmd, pre, notes: [] }); S.termActive = S.terms.length - 1; S.termOpen = true; drawTerm(); setView('term'); };
  const skip = () => (S.cfg.skipPermissions ? ' --dangerously-skip-permissions' : '');
  const resume = (id) => {
    const c = chat(id);
    const target = c.src === 'codex' ? 'terminal' : S.cfg.resumeTarget;
    if (target === 'claude') { toast(`${icon('sparkle', 'spark')} Opened “${esc(c.title)}” in the Claude Code extension`); return; }
    if (target === 'desktop') { toast(`Opening Claude Desktop · <code>claude://resume?session=${c.id}</code>`); return; }
    const at = termFor(id);
    if (at >= 0) {
      S.termActive = at; S.termOpen = true; drawTerm(); setView('term');
      $('#dterm').classList.remove('flash'); void $('#dterm').offsetWidth; $('#dterm').classList.add('flash');
      return;
    }
    c.live = 'wait'; c.mem = '380 MB'; c.cpu = '1%'; c.ago = 0;
    newTerm(c.title, id, c.src === 'codex' ? `codex resume ${c.id}` : `claude --resume ${c.id}${skip()}`);
    drawChats(); drawEditor(); drawQuota();
  };
  // Typing in a terminal writes to the transcript, and the chat view follows it, as the extension's file watch does
  const REPLY = "This is the website demo, so no real Claude answers here. In your editor, Claude's reply lands in the terminal and in this chat view at the same moment.";
  const redrawLive = (id) => {
    drawTerm(); drawChats();
    if (S.active === 'chat:' + id || S.split === id) drawEditor(false, true);
    else if (S.active === 'board') drawEditor();
  };
  const sendFromTerm = (id, text) => {
    const c = chat(id);
    if (!c || !text.trim() || c.live === 'busy') return;
    c.blocks.push(you(text.trim())); c.msgs++; c.live = 'busy'; c.ask = text.trim(); c.ago = 0;
    if (!c.mem) { c.mem = '380 MB'; c.cpu = '2%'; }
    redrawLive(id);
    setTimeout(() => { c.blocks.push(ai(REPLY)); c.msgs++; c.live = 'wait'; c.reply = REPLY; redrawLive(id); }, 2200);
  };
  const addChat = (title, folder, live, blocks) => {
    const c = { id: hex(), title, folder, src: 'claude', live, cost: 0, msgs: 0, ago: 0, model: 'opus', ctx: '2% of 200K', cache: 0, mem: '240 MB', cpu: '2%', words: '', ask: '', reply: 'Waiting for your first message.', blocks };
    CHATS.push(c);
    return c;
  };

  // ---------------------------------------------------------------- right-click menu
  const menu = $('#dctx');
  stage.appendChild(menu);
  const closeMenu = () => { menu.hidden = true; };
  const showMenu = (id, x, y) => {
    const c = chat(id);
    const item = (act, ic, label, extra = '') => `<button type="button" role="menuitem" data-m="${act}"${extra}>${icon(ic)}<span>${label}</span></button>`;
    const groups = ['Backend', 'Docs'];
    menu.innerHTML = `
      ${item('open', 'message', 'Open chat')}
      ${item('resume', 'play', 'Resume')}
      <div class="ctx-sub">${item('', 'layout', c.live ? 'Move to' : 'Open in', ' aria-haspopup="true"')}<div class="ctx-menu">${Object.entries(LAYOUTS).slice(0, 4).map(([k, l]) => `<button type="button" role="menuitem" data-m="split:${k}"><span class="tick">${S.split === id && S.splitMode === k ? '✓' : ''}</span><span>${l.name}</span></button>`).join('')}</div></div>
      ${item('rename', 'pencil', 'Rename…')}
      ${c.src === 'codex' ? '' : item('brief', 'brief', 'Branch with a brief…')}
      <div class="ctx-sep"></div>
      ${item('pin', 'pin', c.pinned ? 'Unpin' : 'Pin')}
      <div class="ctx-sub">${item('', 'folder', c.group ? 'Change group' : 'Add to group', ' aria-haspopup="true"')}<div class="ctx-menu">${groups.map((g) => `<button type="button" role="menuitem" data-m="group:${g}"><span class="tick">${c.group === g ? '✓' : ''}</span><span>${g}</span></button>`).join('')}${c.group ? '<div class="ctx-sep"></div><button type="button" role="menuitem" data-m="group:"><span class="tick"></span><span>Remove from group</span></button>' : ''}</div></div>
      <div class="ctx-sep"></div>
      ${item('archive', 'archive', c.archived ? 'Unarchive' : 'Archive chat')}
      ${item('copy', 'copy', 'Copy resume command')}
      <div class="ctx-sep"></div>
      ${item('trash', 'trash', 'Delete chat…', ' class="danger"')}`;
    menu.dataset.id = id;
    menu.hidden = false;
    const s = stage.getBoundingClientRect();
    const mw = menu.offsetWidth, mh = menu.offsetHeight;
    menu.style.left = Math.max(4, Math.min(x - s.left, s.width - mw - 4)) + 'px';
    menu.style.top = Math.max(4, Math.min(y - s.top, s.height - mh - 4)) + 'px';
    menu.querySelector('[data-m]').focus();
  };
  const rename = (id) => {
    const row = $(`.lb-row[data-id="${id}"]`);
    if (!row) return;
    const c = chat(id);
    // The input replaces the row's button: inside a button, a space would click it
    row.querySelector('.lb-open').outerHTML = `<div class="lb-open"><i class="dot ${c.live}"></i><input class="rename" value="${esc(c.title)}" aria-label="New name"></div>`;
    const input = row.querySelector('.rename');
    input.focus(); input.select();
    let done = false;
    const commit = (keep) => {
      if (done) return; done = true;
      const v = input.value.trim();
      if (keep && v && v !== c.title) {
        c.title = v;
        const at = termFor(id);
        if (at >= 0) { S.terms[at].name = v; if (c.live) S.terms[at].notes.push(`/rename ${v}`); }
        toast(c.live ? 'Renamed the transcript, the running session and its terminal tab' : 'Renamed');
      }
      drawChats(); drawEditor(); drawTerm();
    };
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') commit(true); if (e.key === 'Escape') commit(false); });
    input.addEventListener('blur', () => commit(true));
  };
  const menuAction = (act, id) => {
    const c = chat(id);
    closeMenu();
    if (act === 'open') open('chat:' + id);
    else if (act === 'resume') resume(id);
    else if (act.startsWith('split:')) { S.splitMode = act.slice(6); if (S.active === 'chat:' + id) S.active = S.docs.find((k) => k !== 'chat:' + id) || null; if (!S.active) { const other = CHATS.find((x) => x.id !== id && !x.trashed); open('chat:' + other.id); } S.split = id; drawEditor(); toast(`Opened in ${LAYOUTS[S.splitMode].name.toLowerCase()}. It only ever adds panes, never closes one.`); }
    else if (act === 'rename') rename(id);
    else if (act === 'brief') brief(id);
    else if (act === 'pin') { c.pinned = !c.pinned; drawChats(); }
    else if (act.startsWith('group:')) { c.group = act.slice(6) || undefined; drawChats(); }
    else if (act === 'archive') { c.archived = !c.archived; drawChats(); toast(c.archived ? 'Archived. A copy is kept in ~/.claude/chistory-archive' : 'Restored'); }
    else if (act === 'copy') { navigator.clipboard && navigator.clipboard.writeText(`claude --resume ${id}`).catch(() => {}); toast('Resume command copied'); }
    else if (act === 'trash') { c.trashed = true; S.docs = S.docs.filter((k) => !k.endsWith(id)); if (S.active && S.active.endsWith(id)) S.active = S.docs[0] || null; if (S.split === id) S.split = null; drawChats(); drawEditor(); toast('Moved to ~/.claude/trashed-sessions. Nothing was wiped.'); }
  };
  const brief = (id) => {
    const c = chat(id);
    open('brief:' + id);
    const n = addChat(`Brief: ${c.title}`, c.folder, 'busy', [{ t: 'you', text: `Read the brief at ~/.claude/chistory-briefs/${slug(c.title)}.md, then carry on.` }]);
    n.ask = 'Read the brief, then carry on.'; n.reply = 'Reading the brief…';
    newTerm(n.title, n.id, `claude --session-id ${n.id}${skip()}`, [`Writing a brief from “${c.title}” with claude -p…`, `Saved ~/.claude/chistory-briefs/${slug(c.title)}.md`]);
    drawChats();
  };
  const branch = (id) => {
    const c = chat(id);
    const n = addChat(`Branch of ${c.title}`, c.folder, 'wait', c.blocks.map((b) => ({ ...b, open: false })));
    n.msgs = c.msgs; n.ask = c.ask; n.reply = c.reply; n.ctx = c.ctx;
    newTerm(n.title, n.id, `claude --resume ${c.id} --fork-session${skip()}`);
    drawChats();
  };

  // ---------------------------------------------------------------- tabs + wiring
  const VIEWS = { chats: drawChats, card: drawCard, digest: drawDigest, memory: drawMemory, settings: drawSettings };
  const setTab = (tab) => {
    S.tab = tab;
    setView('side');
    $$('.lb-tab').forEach((b) => { b.classList.toggle('on', b.dataset.tab === tab); b.setAttribute('aria-selected', b.dataset.tab === tab); });
    $$('.lb-view').forEach((v) => v.classList.toggle('on', v.dataset.view === tab));
    $('[data-act="refresh"]').hidden = tab !== 'chats';
    VIEWS[tab]();
  };
  const ACTS = {
    refresh: () => { const b = $('[data-act="refresh"]'); b.classList.remove('spin'); void b.offsetWidth; b.classList.add('spin'); drawChats(); toast(`${CHATS.filter((c) => !c.trashed).length} chats, read from local transcripts`); },
    board: () => open('board'),
    dash: () => open('dash'),
    new: () => { const n = addChat('New chat', 'billing-api', 'wait', []); newTerm('Claude', n.id, `claude --session-id ${n.id}${skip()}`); drawChats(); open('chat:' + n.id); setTimeout(() => { const i = $('#dterm [data-cc]'); if (i) i.focus(); }, 50); },
  };

  demo.addEventListener('click', (e) => {
    const t = e.target.closest('button, input, label, select');
    if (!t || !demo.contains(t)) return;
    const d = t.dataset;
    stopTour(); stage.classList.add('picked');
    if (d.tab) setTab(d.tab);
    else if (d.act) ACTS[d.act]();
    else if (d.open) open('chat:' + d.open);
    else if (d.more) { const r = t.getBoundingClientRect(); showMenu(d.more, r.right - 8, r.bottom); }
    else if (d.folder) { S.collapsed[d.folder] = !S.collapsed[d.folder]; drawChats(); }
    else if (d.arch) { S.archivedOpen[d.arch] = !S.archivedOpen[d.arch]; drawChats(); }
    else if (d.morePage !== undefined) { S.cfg.pageSize += 8; drawChats(); }
    else if (d.chip) { S.filter = d.chip; drawChats(); }
    else if (d.src !== undefined) { S.source = { all: 'claude', claude: 'codex', codex: 'all' }[S.source]; drawChats(); }
    else if (d.stop !== undefined) { toast(`Stopped ${esc(S.leftover.cmd)} and everything it started (SIGTERM)`); S.leftover = null; drawChats(); }
    else if (d.range) { S.range = Number(d.range); drawCard(); }
    else if (d.card) (d.card === 'copy' ? copyCard : saveCard)();
    else if (d.ddays) { S.dDays = Number(d.ddays); S.dOff = 0; drawDigest(); }
    else if (d.doff) { S.dOff = Math.max(0, S.dOff + Number(d.doff)); drawDigest(); }
    else if (d.day) showDay(Number(d.day));
    else if (d.mem) { S.memOpen = Number(d.mem); drawMemory(); }
    else if (d.memback !== undefined) { S.memOpen = null; drawMemory(); }
    else if (d.seg) { S.segs[Number(d.seg)].color = d.color; drawQuota(); drawSettings(); }
    else if (d.segrm) { S.spare.push(...S.segs.splice(Number(d.segrm), 1)); drawQuota(); drawSettings(); }
    else if (d.segadd !== undefined) { S.segs.push(S.spare.shift()); drawQuota(); drawSettings(); }
    else if (d.layout) { S.cfg.layout = d.layout; S.splitMode = d.layout; drawSettings(); }
    else if (d.tabDoc) { S.active = d.tabDoc; drawEditor(true); drawChats(); }
    else if (d.closeDoc) closeDoc(d.closeDoc);
    else if (d.resume) resume(d.resume);
    else if (d.branch) branch(d.branch);
    else if (d.brief) brief(d.brief);
    else if (d.analytics) open('analytics:' + d.analytics);
    else if (d.export) { open('md:' + d.export); toast(`Exported ${slug(chat(d.export).title)}.md`); }
    else if (d.agent) open('agent:' + d.agent);
    else if (d.fold) { const [id, i] = d.fold.split(':'); const b = chat(id).blocks[Number(i)]; b.open = !b.open; drawEditor(); }
    else if (d.diff) open('diff:' + d.diff);
    else if (d.unsplit !== undefined) { S.split = null; drawEditor(); }
    else if (d.copytext) { navigator.clipboard && navigator.clipboard.writeText(d.copytext).catch(() => {}); t.textContent = 'Copied'; setTimeout(() => { t.textContent = 'Copy'; }, 1200); }
    else if (d.dash) { S.dash = d.dash; drawEditor(); }
    else if (d.dashdays) { S.dashDays = Number(d.dashdays); drawEditor(); }
    else if (d.term) { S.termActive = Number(d.term); drawTerm(); setView('term'); }
    else if (d.termclose !== undefined) { S.termOpen = false; drawTerm(); setView('main'); }
  });
  demo.addEventListener('change', (e) => {
    const t = e.target, d = t.dataset;
    if (d.opt) { S.opts[d.opt] = t.checked; drawCard(); }
    if (d.cfg) {
      const C = S.cfg;
      C[d.cfg] = t.type === 'checkbox' ? t.checked : t.type === 'number' ? Math.max(Number(t.min), Math.min(Number(t.max), Number(t.value) || Number(t.min))) : t.value;
      if (d.cfg === 'limitAlerts') S.alerted = false;
      drawQuota(); drawChats();
      if (S.active === 'board' || (S.active || '').startsWith('chat:')) drawEditor();
    }
  });
  demo.addEventListener('input', (e) => {
    if (e.target.id === 'dq-in') { S.q = e.target.value.trim().toLowerCase(); drawChats(); stage.classList.add('picked'); }
    if (e.target.id === 'dmem-in') { S.memQ = e.target.value.trim(); drawMemory(); }
  });
  demo.addEventListener('keydown', (e) => {
    const t = e.target;
    if (t.dataset && t.dataset.cc && e.key === 'Enter') { e.preventDefault(); sendFromTerm(t.dataset.cc, t.value); }
  });
  demo.addEventListener('mouseover', (e) => { const b = e.target.closest('[data-day]'); if (b) showDay(Number(b.dataset.day)); });
  demo.addEventListener('contextmenu', (e) => {
    const row = e.target.closest('.lb-row');
    if (!row) return;
    e.preventDefault(); stopTour();
    showMenu(row.dataset.id, e.clientX, e.clientY);
  });
  menu.addEventListener('click', (e) => { const b = e.target.closest('[data-m]'); if (b && b.dataset.m) menuAction(b.dataset.m, menu.dataset.id); });
  menu.addEventListener('keydown', (e) => {
    const items = [...menu.querySelectorAll(':scope > [data-m]')];
    const i = items.indexOf(document.activeElement);
    if (e.key === 'Escape') { closeMenu(); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus(); }
  });
  document.addEventListener('click', (e) => { if (!menu.contains(e.target) && !e.target.closest('[data-more]')) closeMenu(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  // ---------------------------------------------------------------- first paint
  drawQuota();
  open('chat:4f2a9c1e');
  setTab('chats');

  // ---------------------------------------------------------------- guided tour
  // Until the visitor touches the demo, the "You" cursor shows a few features in turn.
  const youCur = stage.querySelector('.cursor.you');
  const TOUR_CHAT = 'c9e04b17';
  const TOUR_MSG = 'Add a test for the 429.';
  let typedOnce = false;
  // Types into a terminal without taking focus, so the visitor's own focus is left alone
  const typeIn = (el) => {
    typedOnce = true;
    let n = 0;
    const tick = () => {
      if (!tour || !el.isConnected) return;
      el.value = TOUR_MSG.slice(0, ++n);
      if (n < TOUR_MSG.length) setTimeout(tick, 45);
      else setTimeout(() => { if (tour) sendFromTerm(TOUR_CHAT, TOUR_MSG); }, 350);
    };
    tick();
  };
  const STEPS = [
    { q: '.lb-tab[data-tab="chats"]', when: () => S.tab !== 'chats', wait: 1800 },
    { q: `.lb-open[data-open="${TOUR_CHAT}"]`, wait: 2600 },
    { q: `#dpanes [data-resume="${TOUR_CHAT}"]`, wait: 4200 },
    { q: `#dterm [data-cc="${TOUR_CHAT}"]`, when: () => !typedOnce, run: typeIn, wait: 6500 },
    { q: '.lb-tab[data-tab="card"]', wait: 2800 },
    { q: '[data-act="board"]', wait: 2800 },
    { q: '.lb-tab[data-tab="digest"]', wait: 2800 },
  ];
  let tour = null, step = 0, idle = null, touring = false, onScreen = false;
  // Where the real pointer is. A mouse that the page scrolls away from never fires
  // pointerleave, so "is it still over the demo?" is answered from its last position.
  let px = null, py = null, kind = 'mouse';
  const pointerInside = () => {
    if (kind !== 'mouse' || px === null) return false;
    const r = demo.getBoundingClientRect();
    return px >= r.left && px <= r.right && py >= r.top && py <= r.bottom;
  };
  const tourStep = () => {
    // Skip steps whose target the visitor has hidden (a search, a collapsed folder), so the cursor never stalls
    let el = null, st = null;
    for (let tries = 0; tries < STEPS.length && !el; tries++) {
      const cand = STEPS[step++ % STEPS.length];
      if (cand.when && !cand.when()) continue;
      const found = $(cand.q);
      if (found && found.getClientRects().length && !found.disabled) { el = found; st = cand; }
    }
    if (!el) return 1200;
    const run = st.run || ((x) => x.click());
    // On a phone, slide to the screen the target lives on first, then travel to it
    const shift = phone.matches && demo.dataset.mview !== viewOf(el) ? 450 : 0;
    if (shift) setView(viewOf(el));
    setTimeout(() => {
      if (!tour) return;
      const s = stage.getBoundingClientRect(), r = el.getBoundingClientRect();
      youCur.style.left = r.left - s.left + Math.min(r.width * 0.5, 120) + 'px';
      youCur.style.top = r.top - s.top + r.height * 0.55 + 'px';
    }, shift);
    setTimeout(() => { if (tour) el.classList.add('hov'); }, 700 + shift);
    setTimeout(() => {
      el.classList.remove('hov');
      if (!tour || !el.isConnected) return;
      touring = true; run(el); touring = false;
      stage.classList.remove('picked');
      youCur.classList.add('clicking'); setTimeout(() => youCur.classList.remove('clicking'), 250);
    }, 1300 + shift);
    return st.wait + shift;
  };
  function stopTour () {
    if (touring) return;
    clearTimeout(tour); tour = null; clearTimeout(idle);
    stage.classList.remove('touring');
    $$('.hov').forEach((x) => x.classList.remove('hov'));
  }
  const startTour = () => {
    if (tour || !onScreen || pointerInside()) return;
    stage.classList.remove('user-in');
    stage.classList.add('touring');
    const next = () => { tour = setTimeout(next, tourStep()); };
    tour = true; next();
  };
  // The visitor has the demo while they're in it; the tour picks up again shortly after they leave.
  // A tap has no "leave", so on touch screens it waits longer before taking over again.
  const resumeSoon = () => { clearTimeout(idle); idle = setTimeout(startTour, kind === 'mouse' ? 1200 : 8000); };
  if (!reduced) {
    document.addEventListener('pointermove', (e) => { px = e.clientX; py = e.clientY; kind = e.pointerType; }, { passive: true });
    demo.addEventListener('pointerenter', (e) => { kind = e.pointerType; stopTour(); if (kind === 'mouse') stage.classList.add('user-in'); });
    demo.addEventListener('pointerleave', () => { stage.classList.remove('user-in'); resumeSoon(); });
    demo.addEventListener('pointerdown', (e) => { kind = e.pointerType; stopTour(); if (kind !== 'mouse') resumeSoon(); });
    demo.addEventListener('focusin', () => { if (!touring) stopTour(); });
    document.addEventListener('pointerleave', () => { px = null; resumeSoon(); });
    window.addEventListener('scroll', () => {
      if (!tour && !pointerInside()) { stage.classList.remove('user-in'); resumeSoon(); }
    }, { passive: true });
    phone.addEventListener('change', () => { lockForPhone(); setView(S.termOpen ? 'term' : 'side'); stopTour(); startTour(); });
    new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      if (onScreen) startTour(); else stopTour();
    }, { threshold: 0.4 }).observe(demo);
  }
})();
