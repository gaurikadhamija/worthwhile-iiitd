// Run with: npm test   (node:test via tsx; uses an in-memory SQLite database)
import { test, before } from 'node:test';
import assert from 'node:assert/strict';

process.env.WORTHWHILE_DB_PATH = ':memory:';
delete process.env.ALLOW_DEMO_IDENTITY;
delete process.env.GOOGLE_CLIENT_ID;

let api: any, db: any, AuthService: any, seedDatabase: any, verifyGoogleIdToken: any;
let EV: string[] = []; // ACM events with no seeded reviews
let orgToken = '';

type Resp = { status: number; body: any };
async function call(method: string, url: string, opts: { token?: string; body?: any; headers?: Record<string, string> } = {}): Promise<Resp> {
  const headers: Record<string, string> = { ...(opts.headers || {}) };
  if (opts.token) headers.authorization = `Bearer ${opts.token}`;
  const q: Record<string, string> = {};
  const qs = url.split('?')[1];
  if (qs) for (const [k, v] of new URLSearchParams(qs)) q[k] = v;
  const req: any = { method, url, headers, body: opts.body ?? {}, query: q };
  return new Promise<Resp>((resolve, reject) => {
    let status = 200;
    const res: any = {
      status(c: number) { status = c; return res; },
      json(b: any) { resolve({ status, body: b }); return res; },
    };
    try {
      const p = api.handle(req, res, () => resolve({ status: 404, body: null }));
      if (p && typeof p.catch === 'function') {
        p.catch(reject);
      }
    } catch (err) {
      reject(err);
    }
  });
}

let n = 0;
function newStudent(): { id: string; token: string } {
  const s = AuthService.signup({ email: `s${++n}_${Date.now()}@test.edu`, password: 'password123', name: `Student ${n}` });
  return { id: s.user.id, token: s.token };
}
const review = (event_id: string, extra: any = {}) => ({
  event_id, rating_content: 5, rating_speaker: 4, rating_networking: 4, rating_time_spent: 5, rating_logistics: 3, ...extra,
});
const register = (s: { token: string }, ev: string) => call('POST', `/events/${ev}/register`, { token: s.token });
const checkIn = (ev: string, userId: string) => call('POST', `/events/${ev}/attendance`, { token: orgToken, body: { user_id: userId } });

before(async () => {
  ({ db } = await import('../src/backend/db/connection.ts'));
  ({ seedDatabase } = await import('../src/backend/db/seed.ts'));
  ({ AuthService } = await import('../src/backend/services/authService.ts'));
  ({ verifyGoogleIdToken } = await import('../src/backend/services/googleAuth.ts'));
  ({ apiRouter: api } = await import('../src/backend/routes/api.ts'));
  seedDatabase();
  EV = (db.prepare(`SELECT id FROM events WHERE organizer_id = 'org_acm' AND id NOT IN (SELECT event_id FROM reviews) ORDER BY id`).all() as any[]).map(r => r.id);
  assert.ok(EV.length >= 3, 'need at least 3 ACM events without seeded reviews');
  // Test fixture: give the seeded ACM organizer account a session (demo login is disabled by default).
  orgToken = 'test_org_session_token';
  db.prepare(`UPDATE users SET session_token = ? WHERE id = 'usr_organizer_acm'`).run(orgToken);
});

// 1
test('registered user WITHOUT attendance does not get a verified badge', async () => {
  const s = newStudent();
  assert.equal((await register(s, EV[0])).status, 200);
  const r = await call('POST', '/reviews', { token: s.token, body: review(EV[0]) });
  assert.equal(r.status, 201);
  assert.equal(r.body.data.is_verified_attendee, false);
  assert.equal(r.body.data.verification_basis, null);
  const list = await call('GET', `/events/${EV[0]}/reviews`);
  assert.equal(list.body.data.reviews.find((x: any) => x.user_id === s.id).is_verified_attendee, false);
});

// 2
test('organizer check-in makes the review attendance-verified (and verifies an earlier review)', async () => {
  const s = newStudent();
  await register(s, EV[1]);
  assert.equal((await checkIn(EV[1], s.id)).status, 200);
  const r = await call('POST', '/reviews', { token: s.token, body: review(EV[1]) });
  assert.equal(r.status, 201);
  assert.equal(r.body.data.is_verified_attendee, true);
  assert.equal(r.body.data.verification_basis, 'organizer_checkin');

  const late = newStudent();
  await register(late, EV[2]);
  const early = await call('POST', '/reviews', { token: late.token, body: review(EV[2]) });
  assert.equal(early.body.data.is_verified_attendee, false);
  await checkIn(EV[2], late.id);
  const row = db.prepare('SELECT is_verified_attendee FROM reviews WHERE id = ?').get(early.body.data.id) as any;
  assert.equal(row.is_verified_attendee, 1);
});

// 3
test('client cannot force verification or identity via request body', async () => {
  const s = newStudent();
  const other = newStudent();
  await register(s, EV[2]);
  const r = await call('POST', '/reviews', {
    token: s.token,
    body: review(EV[2], { isVerified: true, is_verified_attendee: true, verified: true, user_id: other.id, user_name: 'Hacker' }),
  });
  assert.equal(r.status, 201);
  assert.equal(r.body.data.is_verified_attendee, false);
  assert.equal(r.body.data.user_id, s.id);
  assert.notEqual(r.body.data.user_name, 'Hacker');
});

// 4
test('duplicate review for the same user/event is rejected (API and database)', async () => {
  const s = newStudent();
  await register(s, EV[0]);
  assert.equal((await call('POST', '/reviews', { token: s.token, body: review(EV[0]) })).status, 201);
  assert.equal((await call('POST', '/reviews', { token: s.token, body: review(EV[0]) })).status, 409);
  assert.throws(() => db.prepare(`
    INSERT INTO reviews (id, event_id, user_id, user_name, rating_overall, rating_content, rating_speaker, rating_networking, rating_time_spent, rating_logistics)
    VALUES ('dup_x', ?, ?, 'x', 4, 4, 4, 4, 4, 4)`).run(EV[0], s.id), /UNIQUE/);
});

// 5
test('invalid ratings and malformed payloads are rejected; non-registered users cannot review', async () => {
  const s = newStudent();
  await register(s, EV[0]);
  const bad = [
    review(EV[0], { rating_content: 0 }), review(EV[0], { rating_content: 6 }), review(EV[0], { rating_speaker: '5' }),
    review(EV[0], { rating_logistics: null }), review(EV[0], { rating_networking: NaN }),
    review(EV[0], { comment: 'x'.repeat(1001) }), review(EV[0], { tags: 'nope' }), { rating_content: 5 },
  ];
  for (const b of bad) assert.equal((await call('POST', '/reviews', { token: s.token, body: b })).status, 400, JSON.stringify(b));
  assert.equal((await call('POST', '/reviews', { token: s.token, body: review('evt_does_not_exist') })).status, 404);
  const stranger = newStudent();
  assert.equal((await call('POST', '/reviews', { token: stranger.token, body: review(EV[1]) })).status, 403);
  assert.equal((await call('POST', '/reviews', { token: s.token, body: review(EV[0]) })).status, 201);
});

// 6
test('unauthenticated users cannot submit reviews or perform trust-changing actions', async () => {
  const claim = db.prepare('SELECT id, event_id FROM organizer_claims LIMIT 1').get() as any;
  const checks: Resp[] = [
    await call('POST', '/reviews', { body: review(EV[0]) }),
    await call('POST', `/events/${EV[0]}/register`),
    await call('POST', `/events/${claim.event_id}/evidence`, { body: { claim_id: claim.id, confirmed: true } }),
    await call('POST', `/events/${EV[0]}/attendance`, { body: { user_id: 'usr_demo_student' } }),
    await call('GET', '/organizer/dashboard'),
    await call('POST', '/events', { body: { title: 'x' } }),
    await call('DELETE', `/events/${EV[0]}`),
    await call('GET', '/auth/me'),
  ];
  for (const c of checks) assert.equal(c.status, 401);
  assert.ok(db.prepare('SELECT id FROM events WHERE id = ?').get(EV[0]), 'event must not have been deleted');
});

// 7
test('x-user-id cannot impersonate anyone', async () => {
  const hdr = { 'x-user-id': 'usr_demo_student' };
  assert.equal((await call('POST', '/reviews', { headers: hdr, body: review(EV[0]) })).status, 401);
  assert.equal((await call('GET', '/user/profile', { headers: hdr })).status, 401);
  assert.equal((await call('GET', '/auth/me', { headers: hdr })).status, 401);
  const s = newStudent();
  await register(s, EV[1]);
  const prof = await call('GET', '/user/profile', { token: s.token, headers: hdr });
  assert.equal(prof.body.data.user.id, s.id);
  // demo accounts cannot be logged into without the explicit demo flag
  assert.throws(() => AuthService.login('alex.chen@campus.edu', 'anything'), /Invalid email or password/);
});

// 8
test('organizer-only actions reject students and organizers of other organizers', async () => {
  const s = newStudent();
  const victim = newStudent();
  await register(victim, EV[0]);
  assert.equal((await call('POST', `/events/${EV[0]}/attendance`, { token: s.token, body: { user_id: victim.id } })).status, 403);
  assert.equal((await call('GET', '/organizer/dashboard', { token: s.token })).status, 403);
  assert.equal((await call('PUT', `/events/${EV[0]}`, { token: s.token, body: { title: 'pwned' } })).status, 403);
  // a self-declared "organizer" account that owns no organizer record has no authority
  const fake = AuthService.signup({ email: `fake${Date.now()}@test.edu`, password: 'password123', name: 'Fake Org', role: 'organizer' });
  assert.equal((await call('POST', `/events/${EV[0]}/attendance`, { token: fake.token, body: { user_id: victim.id } })).status, 403);
  assert.equal((await call('GET', '/organizer/dashboard?organizer_id=org_acm', { token: fake.token })).status, 403);
  const row = db.prepare('SELECT attended FROM event_registrations WHERE event_id = ? AND user_id = ?').get(EV[0], victim.id) as any;
  assert.equal(row.attended, 0);
  // check-in requires an existing registration
  assert.equal((await call('POST', `/events/${EV[0]}/attendance`, { token: orgToken, body: { user_id: s.id } })).status, 404);
});

// 9
test('seed/demo evidence is flagged and never counted as verified evidence', async () => {
  const demoReviews = db.prepare('SELECT is_demo, is_verified_attendee FROM reviews WHERE id LIKE ?').all('rev_%') as any[];
  assert.ok(demoReviews.filter(r => r.is_demo === 1).length >= 6);
  assert.ok(demoReviews.filter(r => r.is_demo === 1).every(r => r.is_verified_attendee === 0));
  const seededReg = db.prepare("SELECT attendance_source FROM event_registrations WHERE attended = 1 AND user_id = 'usr_demo_student'").get() as any;
  assert.equal(seededReg.attendance_source, 'demo_seed');
  const ev = await call('GET', '/events/evt_genai_masterclass');
  assert.equal(ev.body.data.community_insights.isDemoSample, true);
  assert.equal(ev.body.data.community_insights.verifiedReviews, 0);
  assert.equal(ev.body.data.rating_is_demo, true);
  assert.equal(ev.body.data.verified_review_count, 0);
  assert.ok(ev.body.data.claims.every((c: any) => c.evidence_tier === 'demo'));
  assert.equal(ev.body.data.organizer.verified, false);
  assert.equal(ev.body.data.organizer.is_demo, true);
  // events with no reviews report unknown, not a default score
  const noRev = (db.prepare(`SELECT id FROM events e WHERE NOT EXISTS (SELECT 1 FROM reviews r WHERE r.event_id = e.id)`).get() as any).id;
  const unk = await call('GET', `/events/${noRev}`);
  assert.equal(unk.body.data.rating_avg, null);
  assert.equal(unk.body.data.community_insights.hasData, false);
});

// 10
test('claim evidence is "submitted" until enough checked-in attendees confirm; clicks do not verify', async () => {
  const ev = EV[0];
  db.prepare(`INSERT INTO organizer_claims (id, event_id, claim_text, claim_category, promised_outcome, is_demo)
              VALUES ('clm_real_1', ?, 'Real claim', 'food', 'Free lunch', 0)`).run(ev);

  const fakes = [newStudent(), newStudent(), newStudent(), newStudent(), newStudent()];
  for (const f of fakes) {
    await register(f, ev);
    const r = await call('POST', `/events/${ev}/evidence`, { token: f.token, body: { claim_id: 'clm_real_1', confirmed: true, notes: 'private note' } });
    assert.equal(r.status, 200);
  }
  let claim = (await call('GET', `/events/${ev}/claims`)).body.data.find((c: any) => c.id === 'clm_real_1');
  assert.equal(claim.verification_status, 'insufficient_evidence');
  assert.equal(claim.evidence_tier, 'submitted');
  assert.equal(claim.submitted_count, 5);
  assert.match(claim.evidence_label, /awaiting verification/i);
  assert.equal(JSON.stringify(claim).includes('private note'), false, 'evidence notes must not be public');

  // re-submitting replaces the response rather than inflating the sample
  await call('POST', `/events/${ev}/evidence`, { token: fakes[0].token, body: { claim_id: 'clm_real_1', confirmed: true } });
  claim = (await call('GET', `/events/${ev}/claims`)).body.data.find((c: any) => c.id === 'clm_real_1');
  assert.equal(claim.submitted_count, 5);

  // only after organizer check-in do responses count as attendee evidence
  for (const f of fakes) await checkIn(ev, f.id);
  claim = (await call('GET', `/events/${ev}/claims`)).body.data.find((c: any) => c.id === 'clm_real_1');
  assert.equal(claim.evidence_tier, 'verified');
  assert.equal(claim.verification_status, 'verified');
  assert.equal(claim.student_sample_size, 5);

  // demo claims keep their seeded, labelled figures and are not altered by evidence submission
  const demoClaim = db.prepare("SELECT id, event_id FROM organizer_claims WHERE is_demo = 1 LIMIT 1").get() as any;
  const before = (await call('GET', `/events/${demoClaim.event_id}/claims`)).body.data.find((c: any) => c.id === demoClaim.id);
  assert.equal(before.evidence_tier, 'demo');
  // wrong event / invalid body / organizer self-confirmation
  const s = newStudent();
  assert.equal((await call('POST', `/events/${EV[1]}/evidence`, { token: s.token, body: { claim_id: 'clm_real_1', confirmed: true } })).status, 404);
  assert.equal((await call('POST', `/events/${ev}/evidence`, { token: s.token, body: { claim_id: 'clm_real_1', confirmed: 'yes' } })).status, 400);
  assert.equal((await call('POST', `/events/${ev}/evidence`, { token: orgToken, body: { claim_id: 'clm_real_1', confirmed: true } })).status, 403);
});

// 11
test('organizer metrics separate real activity from demo data', async () => {
  const d = (await call('GET', '/organizer/dashboard', { token: orgToken })).body.data;
  assert.equal(d.organizer.verified, false);
  assert.ok(d.demoSample && d.demoSample.isDemo);
  assert.ok(d.demoSample.totalRegistrations > 100, 'demo figures live under demoSample');
  assert.ok(d.summaryCards.totalRegistrations < 100, 'real totals must not include seeded analytics');
  const real = db.prepare(`SELECT COUNT(*) c, AVG(r.rating_overall) a, SUM(r.is_verified_attendee) v FROM reviews r
    JOIN events e ON e.id = r.event_id WHERE e.organizer_id = 'org_acm' AND r.is_demo = 0`).get() as any;
  assert.equal(d.summaryCards.reviewCount, real.c, 'demo reviews excluded from real review count');
  assert.equal(d.summaryCards.averageRating, Number(real.a.toFixed(1)), 'average uses real reviews only');
  assert.equal(d.summaryCards.verifiedReviewCount, real.v);
  assert.ok(d.summaryCards.verifiedReviewCount <= d.summaryCards.reviewCount);
  // an organizer with only demo data has no real rating at all (unknown, not a default)
  db.prepare("UPDATE users SET session_token = 'adm' WHERE id = 'usr_admin_dean'").run();
  const q = (await call('GET', '/organizer/dashboard?organizer_id=org_quant_finance', { token: 'adm' })).body.data;
  assert.equal(q.summaryCards.averageRating, null);
  assert.equal(q.summaryCards.totalRegistrations, 0);
  assert.equal(q.summaryCards.attendanceRatePct, null);
});

// 12
test('public event discovery works without authentication', async () => {
  const list = await call('GET', '/events');
  assert.equal(list.status, 200);
  assert.ok(list.body.data.length >= 10);
  assert.ok(list.body.data[0].relevance);
  assert.equal((await call('GET', `/events/${EV[0]}`)).status, 200);
  assert.equal((await call('GET', `/events/${EV[0]}/claims`)).status, 200);
  assert.equal((await call('GET', '/events/recommended')).status, 200);
});

// auth hardening
test('password reset does not leak tokens; Google login fails safe and requires a verified credential', async () => {
  const s = newStudent();
  const email = (db.prepare('SELECT email FROM users WHERE id = ?').get(s.id) as any).email;
  const reset = await call('POST', '/auth/forgot-password', { body: { email } });
  assert.equal(reset.status, 200);
  assert.equal(JSON.stringify(reset.body).includes('resetToken'), false);
  assert.equal(JSON.stringify((await call('POST', '/auth/forgot-password', { body: { email: 'nobody@x.edu' } })).body), JSON.stringify(reset.body));

  // client-supplied email/name must not log anyone in
  const g = await call('POST', '/auth/google', { body: { email: 'alex.chen@campus.edu', name: 'Alex' } });
  assert.ok(g.status === 503 || g.status === 400 || g.status === 401);
  assert.equal(g.body.data, undefined);

  process.env.GOOGLE_CLIENT_ID = 'cid.apps.googleusercontent.com';
  const goodInfo = { iss: 'https://accounts.google.com', aud: 'cid.apps.googleusercontent.com', exp: String(Math.floor(Date.now() / 1000) + 600), email: 'a@b.edu', email_verified: 'true', name: 'A' };
  const f = (info: any, ok = true) => async () => ({ ok, json: async () => info });
  const tok = 'x'.repeat(40);
  assert.equal((await verifyGoogleIdToken(tok, f(goodInfo))).email, 'a@b.edu');
  for (const bad of [{ ...goodInfo, aud: 'other' }, { ...goodInfo, email_verified: 'false' }, { ...goodInfo, exp: '1' }, { ...goodInfo, iss: 'evil.com' }]) {
    await assert.rejects(() => verifyGoogleIdToken(tok, f(bad)));
  }
  await assert.rejects(() => verifyGoogleIdToken(tok, f({}, false)));
  delete process.env.GOOGLE_CLIENT_ID;
  await assert.rejects(() => verifyGoogleIdToken(tok, f(goodInfo)), /not configured/);
});

test('seed is safe to re-run and trust migration is idempotent', async () => {
  seedDatabase(true);
  seedDatabase(true);
  const demoRev = db.prepare('SELECT COUNT(*) c FROM reviews WHERE is_demo = 1 AND is_verified_attendee = 0').get() as any;
  assert.ok(demoRev.c >= 6);
  const { initializeSchema } = await import('../src/backend/db/schema.ts');
  initializeSchema();
  initializeSchema();
});
