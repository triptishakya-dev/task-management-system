import "dotenv/config";
import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const scrypt = promisify(scryptCallback) as (password: string, salt: Buffer, length: number) => Promise<Buffer>;
const email = (process.env.ADMIN_EMAIL ?? "admin@reds.local").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? "Admin@2026!";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function hashPassword(value: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(value, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

async function seed() {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("ADMIN_EMAIL must be a valid email address.");
  if (password.length < 8) throw new Error("ADMIN_PASSWORD must have at least 8 characters.");

  const passwordHash = await hashPassword(password);
  const name = "System Administrator";
  await prisma.user.upsert({ where: { email }, update: { name, password: passwordHash, role: "ADMIN" }, create: { name, email, password: passwordHash, role: "ADMIN" } });
  console.log(`Seeded administrator account: ${email}`);
  await prisma.$disconnect();
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
