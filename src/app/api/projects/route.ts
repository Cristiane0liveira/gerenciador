import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

const schema = z.object({ name: z.string().trim().min(2).max(100), description: z.string().max(1000).optional().default("") });

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const projects = await db.project.findMany({
    where: user.role === "ADMIN" ? {} : { members: { some: { userId: user.id } } },
    include: { _count: { select: { tasks: true } } }, orderBy: { updatedAt: "desc" }
  });
  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Nome do projeto inválido." }, { status: 400 });
  const project = await db.project.create({
  data: {
    ...parsed.data,
    ownerId: user.id,
    members: {
      create: { userId: user.id }
    }
  },
  include: {
    _count: {
      select: { tasks: true }
    }
  }
})
}
