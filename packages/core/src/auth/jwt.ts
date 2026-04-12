export type JWTPayload = {
  userId: string;
  username: string;
  roleIds: string[];
  permissions: string[];
  jti?: string;
};

import crypto from 'crypto';
import type { JsonStore } from '../storage/json-store.js';
import { TokenBlacklist } from './token-blacklist.js';
import { ConfigService } from '../config/config-service.js';

const configService = new ConfigService();
const JWT_SECRET: string = configService.get('auth').jwtSecret || (console.warn('[WARN] JWT_SECRET not set, using generated secret'), crypto.randomBytes(32).toString('hex'));
const JWT_EXPIRES_IN = 7200;
const REFRESH_EXPIRES_IN = 604800;

function base64UrlEncode(input: Buffer): string {
  return input.toString('base64')
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlEncodeObject(obj: any): string {
  const json = JSON.stringify(obj);
  return base64UrlEncode(Buffer.from(json, 'utf8'));
}

function base64UrlDecodeToObject(str: string): any {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  // Pad with '=' to multiple of 4
  const pad = base64.length % 4;
  const padded = base64 + (pad ? '='.repeat(4 - pad) : '');
  const json = Buffer.from(padded, 'base64').toString('utf8');
  return JSON.parse(json);
}

let blacklist: TokenBlacklist | null = null;

export function setTokenBlacklistStore(store: JsonStore): void {
  blacklist = new TokenBlacklist(store);
}

function signUnsigned(headerB64: string, payloadB64: string): string {
  const unsigned = `${headerB64}.${payloadB64}`;
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(unsigned).digest();
  const sigB64 = base64UrlEncode(sig);
  return `${unsigned}.${sigB64}`;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + JWT_EXPIRES_IN;
  const jti = crypto.randomUUID();
  const headerB64 = base64UrlEncodeObject(header);
  const payloadWithExp = { ...payload, jti, exp };
  const payloadB64 = base64UrlEncodeObject(payloadWithExp);
  return signUnsigned(headerB64, payloadB64);
}

export async function generateRefreshToken(userId: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const jti = crypto.randomUUID();
  const exp = Math.floor(Date.now() / 1000) + REFRESH_EXPIRES_IN;
  const headerB64 = base64UrlEncodeObject(header);
  const payloadB64 = base64UrlEncodeObject({ sub: userId, type: 'refresh', jti, exp });
  return signUnsigned(headerB64, payloadB64);
}

export async function verifyRefreshToken(token: string): Promise<{ userId: string; jti: string } | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signature] = parts;
    const unsigned = `${headerB64}.${payloadB64}`;
    const expectedSig = base64UrlEncode(crypto.createHmac('sha256', JWT_SECRET).update(unsigned).digest());
    const bufA = Buffer.from(expectedSig);
    const bufB = Buffer.from(signature);
    if (bufA.length !== bufB.length) return null;
    if (!crypto.timingSafeEqual(bufA, bufB)) return null;

    const payload = base64UrlDecodeToObject(payloadB64) as { sub?: string; type?: string; jti?: string; exp?: number };
    if (payload.type !== 'refresh') return null;
    if (typeof payload.exp === 'number') {
      if (Math.floor(Date.now() / 1000) >= payload.exp) return null;
    }
    if (!payload.sub || !payload.jti) return null;
    if (blacklist && await blacklist.isRevoked(payload.jti)) return null;
    return { userId: payload.sub, jti: payload.jti };
  } catch {
    return null;
  }
}

export async function revokeToken(jti: string, expiresAt: number): Promise<void> {
  if (!blacklist) return;
  await blacklist.add(jti, expiresAt);
}

export async function isTokenRevoked(jti: string): Promise<boolean> {
  if (!blacklist) return false;
  return blacklist.isRevoked(jti);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signature] = parts;
    // Recompute signature
    const unsigned = `${headerB64}.${payloadB64}`;
    const expectedSig = base64UrlEncode(crypto.createHmac('sha256', JWT_SECRET).update(unsigned).digest());
    // Timing-safe compare
    const bufA = Buffer.from(expectedSig);
    const bufB = Buffer.from(signature);
    if (bufA.length !== bufB.length) return null;
    if (!crypto.timingSafeEqual(bufA, bufB)) return null;

    const payload = base64UrlDecodeToObject(payloadB64) as JWTPayload & { exp?: number; };
    if (typeof payload.exp === 'number') {
      const now = Math.floor(Date.now() / 1000);
      if (now >= payload.exp) return null;
    }
    if (payload.jti && blacklist && await blacklist.isRevoked(payload.jti)) return null;
    const { exp, ...rest } = payload as any;
    return rest as JWTPayload;
  } catch {
    return null;
  }
}
