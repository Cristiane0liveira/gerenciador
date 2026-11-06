
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

type Context = {
  params: Promise<{ id: string }>;
};

const addMemberSchema = z.object({
  email: z.string().trim().email().max(160),
});

async function getProjectAccess(id: string, userId: string) {
  return db.project.findFirst({
    where: {
      id,
      members: { some: { userId } },
    },
    select: { id: true },
  });
}

// Lista os integrantes do projeto.
export async function GET(
  _req: NextRequest,
  ctx: Context
) {
  const user = await getSession();

  if (!user) {
    return NextResponse.json(
      { error: "Não autenticado." },
      { status: 401 }
    );
  }

  const { id } = await ctx.params;

  const project = await db.project.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!project) {
    return NextResponse.json(
      { error: "Projeto não encontrado." },
      { status: 404 }
    );
  }

  if (
    user.role !== "ADMIN" &&
    !(await getProjectAccess(id, user.id))
  ) {
    return NextResponse.json(
      { error: "Sem permissão para visualizar os membros." },
      { status: 403 }
    );
  }

  const members = await db.projectMember.findMany({
    where: { projectId: id },
    select: {
      id: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ members });
}

// Adiciona um usuário já cadastrado ao projeto.
// Somente administradores podem gerenciar membros.
export async function POST(
  req: NextRequest,
  ctx: Context
) {
  const user = await getSession();

  if (!user) {
    return NextResponse.json(
      { error: "Não autenticado." },
      { status: 401 }
    );
  }

  if (user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Somente administradores podem adicionar membros." },
      { status: 403 }
    );
  }

  const { id } = await ctx.params;
  const parsed = addMemberSchema.safeParse(await req.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Informe um e-mail válido." },
      { status: 400 }
    );
  }

  const project = await db.project.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!project) {
    return NextResponse.json(
      { error: "Projeto não encontrado." },
      { status: 404 }
    );
  }

  const email = parsed.data.email.toLowerCase();

  const member = await db.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!member) {
    return NextResponse.json(
      { error: "Não existe usuário cadastrado com esse e-mail." },
      { status: 404 }
    );
  }

  const existing = await db.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId: id,
        userId: member.id,
      },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Esse usuário já faz parte do projeto." },
      { status: 409 }
    );
  }

  await db.projectMember.create({
    data: {
      projectId: id,
      userId: member.id,
    },
  });

  return NextResponse.json(
    { member },
    { status: 201 }
  );
}

// Remove a associação de um usuário com o projeto.
// A conta do usuário permanece cadastrada.
export async function DELETE(
  req: NextRequest,
  ctx: Context
) {
  const user = await getSession();

  if (!user) {
    return NextResponse.json(
      { error: "Não autenticado." },
      { status: 401 }
    );
  }

  if (user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Somente administradores podem remover membros." },
      { status: 403 }
    );
  }

  const { id } = await ctx.params;

  const bodySchema = z.object({
    userId: z.string().min(1),
  });

  const parsed = bodySchema.safeParse(await req.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Identificador do usuário inválido." },
      { status: 400 }
    );
  }

  const project = await db.project.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!project) {
    return NextResponse.json(
      { error: "Projeto não encontrado." },
      { status: 404 }
    );
  }

  const membership = await db.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId: id,
        userId: parsed.data.userId,
      },
    },
  });

  if (!membership) {
    return NextResponse.json(
      { error: "Esse usuário não faz parte do projeto." },
      { status: 404 }
    );
  }

  await db.projectMember.delete({
    where: { id: membership.id },
  });

  return NextResponse.json({ ok: true });
}
