import { NextResponse } from "next/server";
import { DUMMY_HASH, setSessionCookie, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_BODY_BYTES = 10_000;

// POST /api/auth/signin  { email, password }
export async function POST(req: Request) {
  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request is too large" }, { status: 413 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json({ error: "Request body must be JSON" }, { status: 415 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body contains invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const { email: rawEmail, password: rawPassword } = body as { email?: unknown; password?: unknown };
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  const password = typeof rawPassword === "string" ? rawPassword : "";

  if (!email || !password) return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  if (password.length > 128) return NextResponse.json({ error: "Password is too long" }, { status: 400 });

  try {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, name: true, role: true, password: true } });
    const ok = await verifyPassword(password, user?.password ?? DUMMY_HASH);

    // Keep this message generic so attackers cannot tell whether the email
    // exists or only the password is wrong.
    if (!user || !ok) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

    await setSessionCookie(user.id);
    return NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch (error) {
    // Handles a disconnected database or other service failure.
    // Do not expose the database error to the browser.
    console.error("Sign-in service error:", error);
    return NextResponse.json({ error: "Sign-in is temporarily unavailable. Please try again." }, { status: 503 });
  }
}
