import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

const schema = z.object({
  title: z.string().trim().min(2).max(160).optional(),
  description: z.string().max(3000).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional()
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id } = await ctx.params;
  const existing = await db.task.findUnique({ where: { id }, include: { project: { include: { members: true } } } });
  if (!existing) return NextResponse.json({ error: "Tarefa não encontrada." }, { status: 404 });
  if (user.role !== "ADMIN" && !existing.project.members.some(m => m.userId === user.id))
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success || Object.keys(parsed.data).length === 0) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  const data = parsed.data;
  if (data.assigneeId) {
    const member = await db.projectMember.findUnique({ where: { projectId_userId: { projectId: existing.projectId, userId: data.assigneeId } } });
    if (!member) return NextResponse.json({ error: "O responsável deve pertencer ao projeto." }, { status: 400 });
  }
  const task = await db.task.update({
    where: { id },
    data: {
      ...data,
      ...(data.dueDate !== undefined ? { dueDate: data.dueDate ? new Date(data.dueDate) : null } : {})
    },
    include: { assignee: { select: { id: true, name: true, email: true } }, project: { select: { id: true, name: true } } }
  });
  return NextResponse.json({ task });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id } = await ctx.params;
  const existing = await db.task.findUnique({ where: { id }, include: { project: { include: { members: true } } } });
  if (!existing) return NextResponse.json({ error: "Tarefa não encontrada." }, { status: 404 });
  if (user.role !== "ADMIN" && !existing.project.members.some(m => m.userId === user.id))
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  await db.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
