import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encodeAssignees, noteFor, progressFor, STATUSES, TAG_COLORS, taskForApi, type TaskStatus } from "@/lib/tasks";

type Ctx = { params: Promise<{ id: string }> };
const getTask = (id: string) => prisma.task.findUnique({ where: { id } });

export async function GET(_: Request, { params }: Ctx) { const task = await getTask((await params).id); return task ? NextResponse.json(taskForApi(task)) : NextResponse.json({ error: "Not found" }, { status: 404 }); }

export async function PATCH(req: Request, { params }: Ctx) {
  const id = (await params).id;
  const body = await req.json().catch(() => null);
  const current = await getTask(id);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (body.status !== undefined && !STATUSES.includes(body.status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  const status = (body.status ?? current.status) as TaskStatus;
  const progress = typeof body.progress === "number" ? Math.min(100, Math.max(0, Math.round(body.progress))) : status !== current.status ? progressFor(status, current.progress) : current.progress;
  const position = typeof body.position === "number" ? Math.max(0, Math.round(body.position)) : status !== current.status ? ((await prisma.task.aggregate({ where: { status }, _max: { position: true } }))._max.position ?? -1) + 1 : current.position;
  const next = { title: typeof body.title === "string" && body.title.trim() ? body.title.trim() : current.title, tag: typeof body.tag === "string" && body.tag.trim() ? body.tag.trim().toUpperCase().slice(0, 20) : current.tag, tagColor: TAG_COLORS.includes(body.tagColor) ? body.tagColor : current.tagColor, assignees: Array.isArray(body.assignees) ? encodeAssignees(body.assignees.filter((item: unknown): item is string => typeof item === "string").slice(0, 5)) : current.assignees };
  const task = await prisma.task.update({ where: { id }, data: { ...next, note: noteFor(status, progress), progress, status, position } });
  return NextResponse.json(taskForApi(task));
}

export const PUT = PATCH;
export async function DELETE(_: Request, { params }: Ctx) { const id = (await params).id; if (!await getTask(id)) return NextResponse.json({ error: "Not found" }, { status: 404 }); await prisma.task.delete({ where: { id } }); return NextResponse.json({ ok: true }); }
