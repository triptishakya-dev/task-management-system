import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { STATUSES, type TaskStatus } from "@/lib/tasks";
export async function GET() { const byStatus = Object.fromEntries(STATUSES.map((status) => [status, 0])) as Record<TaskStatus, number>; const groups = await prisma.task.groupBy({ by: ["status"], _count: { _all: true } }); groups.forEach((group) => { if (STATUSES.includes(group.status as TaskStatus)) byStatus[group.status as TaskStatus] = group._count._all; }); const total = Object.values(byStatus).reduce((sum, value) => sum + value, 0); return NextResponse.json({ total, completed: byStatus.COMPLETED, byStatus }); }
