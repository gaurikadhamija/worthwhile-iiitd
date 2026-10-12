import { HttpError } from './errors.js';

export interface GoogleIdentity { email: string; name: string; picture?: string }

type Fetcher = (url: string) => Promise<{ ok: boolean; json(): Promise<any> }>;

/**
 * Verifies a Google-issued ID token (credential from Google Identity Services) using Google's
 * tokeninfo endpoint, then checks audience, issuer, expiry and email_verified.
 * Requires GOOGLE_CLIENT_ID; if it is missing we FAIL SAFE (503) rather than trust client-supplied profile data.
 */
export async function verifyGoogleIdToken(idToken: unknown, fetcher: Fetcher = fetch as any): Promise<GoogleIdentity> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new HttpError(503, 'Google sign-in is not configured on this server (GOOGLE_CLIENT_ID missing).');
  if (typeof idToken !== 'string' || idToken.length < 20 || idToken.length > 4096) throw new HttpError(400, 'A Google credential is required.');

  let info: any;
  try {
    const res = await fetcher(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!res.ok) throw new Error('rejected');
    info = await res.json();
  } catch {
    throw new HttpError(401, 'Google credential could not be verified.');
  }
  const issOk = info.iss === 'accounts.google.com' || info.iss === 'https://accounts.google.com';
  const expOk = Number(info.exp) * 1000 > Date.now();
  const verified = info.email_verified === true || info.email_verified === 'true';
  if (info.aud !== clientId || !issOk || !expOk || !verified || typeof info.email !== 'string') {
    throw new HttpError(401, 'Google credential is invalid.');
  }
  return { email: info.email, name: info.name || info.email.split('@')[0], picture: info.picture };
}
