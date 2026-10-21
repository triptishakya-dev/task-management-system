import { NextResponse } from "next/server";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/users -> registered users (requires an authenticated session)
export async function GET() {
  if (!await getCurrentUser()) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}

// POST /api/users -> create a user with an email and password
export async function POST(request: Request) {
  if (!await getCurrentUser()) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  if (password.length > 128) return NextResponse.json({ error: "Password is too long" }, { status: 400 });
  try {
    const user = await prisma.user.create({ data: { name: email.split("@")[0].slice(0, 80) || "New user", email, password: await hashPassword(password), role: "OPERATOR" }, select: { id: true, name: true, email: true, role: true } });
    return NextResponse.json(user, { status: 201 });
  } catch (error: unknown) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    console.error("Create user service error:", error);
    return NextResponse.json({ error: "User creation is temporarily unavailable. Please try again." }, { status: 503 });
  }
}
