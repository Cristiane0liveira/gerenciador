import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

const createSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().max(3000).optional().default(""),
  projectId: z.string().min(1),
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]).optional().default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional().default("MEDIUM"),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable()
});

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const projectId = req.nextUrl.searchParams.get("projectId") || undefined;
  const tasks = await db.task.findMany({
    where: {
      ...(projectId ? { projectId } : {}),
      ...(user.role === "ADMIN" ? {} : { project: { members: { some: { userId: user.id } } } })
    },
    include: { assignee: { select: { id: true, name: true, email: true } }, project: { select: { id: true, name: true } } },
    orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }]
  });
  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Confira título, projeto e demais campos." }, { status: 400 });
  const data = parsed.data;
  const project = await db.project.findUnique({ where: { id: data.projectId }, include: { members: true } });
  if (!project) return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 });
  if (user.role !== "ADMIN" && !project.members.some(m => m.userId === user.id))
    return NextResponse.json({ error: "Você não pertence a este projeto." }, { status: 403 });
  if (data.assigneeId) {
    const member = await db.projectMember.findUnique({ where: { projectId_userId: { projectId: data.projectId, userId: data.assigneeId } } });
    if (!member) return NextResponse.json({ error: "O responsável deve pertencer ao projeto." }, { status: 400 });
  }
  const task = await db.task.create({
    data: {
      title: data.title, description: data.description, projectId: data.projectId,
      status: data.status, priority: data.priority, creatorId: user.id,
      assigneeId: data.assigneeId || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null
    },
    include: { assignee: { select: { id: true, name: true, email: true } }, project: { select: { id: true, name: true } } }
  });
  return NextResponse.json({ task }, { status: 201 });
}
