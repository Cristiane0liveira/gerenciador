import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  const admin = await db.user.findFirst();
  if (!admin) {
    console.log("Nenhum usuário encontrado. Crie a primeira conta pela tela de cadastro.");
    return;
  }
  const existing = await db.project.findFirst({ where: { name: "Projeto de demonstração" } });
  if (!existing) {
    const project = await db.project.create({
      data: {
        name: "Projeto de demonstração",
        description: "Projeto inicial para explorar o Atlas Hub.",
        members: { create: { userId: admin.id } }
      }
    });
    await db.task.createMany({
      data: [
        { title: "Definir requisitos do projeto", description: "Consolidar os requisitos funcionais.", projectId: project.id, creatorId: admin.id, status: "DONE", priority: "HIGH" },
        { title: "Construir quadro Kanban", description: "Implementar as colunas de status.", projectId: project.id, creatorId: admin.id, status: "IN_PROGRESS", priority: "URGENT" },
        { title: "Validar o fluxo de tarefas", description: "Testar criação e atualização.", projectId: project.id, creatorId: admin.id, status: "TODO", priority: "MEDIUM" }
      ]
    });
  }
}
main().finally(() => db.$disconnect());
