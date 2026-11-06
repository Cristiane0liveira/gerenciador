import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

const schema = z.object({ name: z.string().trim().min(2).max(100).optional(), description: z.string().max(1000).optional() });

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id } = await ctx.params;
  const existing = await db.project.findUnique({ where: { id }, include: { members: true } });
  if (!existing) return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 });
  if (user.role !== "ADMIN" && !existing.members.some(m => m.userId === user.id))
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success || Object.keys(parsed.data).length === 0) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  const project = await db.project.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ project });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Somente administradores podem excluir projetos." }, { status: 403 });
  const { id } = await ctx.params;
  await db.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
