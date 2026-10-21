import { NextResponse } from "next/server";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/signup  { name, email, password }
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  if (password.length > 128) return NextResponse.json({ error: "Password is too long" }, { status: 400 });

  try {
    const user = await prisma.user.create({ data: { name: name.slice(0, 80), email, password: await hashPassword(password), role: "OPERATOR" }, select: { id: true, name: true, email: true, role: true } });
    await setSessionCookie(user.id);
    return NextResponse.json(user, { status: 201 });
  } catch (error: unknown) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    console.error("Sign-up service error:", error);
    return NextResponse.json({ error: "Registration is temporarily unavailable. Please try again." }, { status: 503 });
  }
}
