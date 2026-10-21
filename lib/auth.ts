import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export const SESSION_COOKIE = "reds_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return s;
}

/* ---------- passwords ---------- */

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}

// Used to keep sign-in timing similar when the email does not exist.
export const DUMMY_HASH = `${"00".repeat(16)}:${"00".repeat(64)}`;

/* ---------- sessions (signed cookie: userId.expiry.signature) ---------- */

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

export function createSessionToken(userId: string) {
  const payload = `${userId}.${Math.floor(Date.now() / 1000) + SESSION_MAX_AGE}`;
  return `${payload}.${sign(payload)}`;
}

function readSessionToken(token: string | undefined) {
  if (!token) return null;
  const i = token.lastIndexOf(".");
  if (i < 0) return null;
  const payload = token.slice(0, i);
  const sig = Buffer.from(token.slice(i + 1));
  const good = Buffer.from(sign(payload));
  if (sig.length !== good.length || !timingSafeEqual(sig, good)) return null;
  const [userId, exp] = payload.split(".");
  if (!userId || Number(exp) < Date.now() / 1000) return null;
  return userId;
}

export async function setSessionCookie(userId: string) {
  (await cookies()).set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const userId = readSessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true },
  });
}
