import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160),
  password: z.string().min(8).max(100)
});

export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Informe nome, e-mail válido e senha com pelo menos 8 caracteres." }, { status: 400 });
    const { name, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();
    if (await db.user.findUnique({ where: { email: normalizedEmail } }))
      return NextResponse.json({ error: "Este e-mail já está cadastrado." }, { status: 409 });
    const count = await db.user.count();
    const user = await db.user.create({
      data: { name, email: normalizedEmail, passwordHash: await bcrypt.hash(password, 12), role: count === 0 ? "ADMIN" : "MEMBER" },
      select: { id: true, name: true, email: true, role: true }
    });
    await createSession(user);
    return NextResponse.json({ user }, { status: 201 });
     } catch (error) {
    console.error("[REGISTER_ERROR]", error);

    return NextResponse.json(
      { error: "Não foi possível criar a conta." },
      { status: 500 }
    );
  }
  }
