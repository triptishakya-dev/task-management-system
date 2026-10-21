import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encodeAssignees, noteFor, progressFor, SEED_TASKS, STATUSES, TAG_COLORS, taskForApi, type TaskStatus } from "@/lib/tasks";

export const dynamic = "force-dynamic";

async function seedOnce() {
  if (await prisma.task.count()) return;
  await prisma.task.createMany({ data: SEED_TASKS.map((task, position) => ({ title: task.title, tag: task.tag, tagColor: task.tagColor, note: noteFor(task.status, task.progress), progress: task.progress, status: task.status, position, assignees: encodeAssignees(task.assignees) })) });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q")?.trim();
  if (status && !STATUSES.includes(status as TaskStatus)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  if (!status && !q) await seedOnce();
  const tasks = await prisma.task.findMany({
    where: { ...(status ? { status } : {}), ...(q ? { title: { contains: q, mode: "insensitive" } } : {}) },
    orderBy: [{ status: "asc" }, { position: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(tasks.map(taskForApi));
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  const status: TaskStatus = STATUSES.includes(body.status) ? body.status : "PENDING";
  const progress = progressFor(status, 0);
  const assignees = Array.isArray(body.assignees) ? body.assignees.filter((item: unknown): item is string => typeof item === "string").slice(0, 5) : [];
  const position = ((await prisma.task.aggregate({ where: { status }, _max: { position: true } }))._max.position ?? -1) + 1;
  const task = await prisma.task.create({ data: { title, tag: (typeof body.tag === "string" && body.tag.trim() ? body.tag.trim() : "GENERAL").toUpperCase().slice(0, 20), tagColor: TAG_COLORS.includes(body.tagColor) ? body.tagColor : "purple", note: noteFor(status, progress), progress, status, position, assignees: encodeAssignees(assignees) } });
  return NextResponse.json(taskForApi(task), { status: 201 });
}
