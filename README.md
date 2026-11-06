# Atlas Hub

MVP de um gerenciador de tarefas para a ATLAS — Soluções em Tecnologia, desenvolvido com Next.js, React, TypeScript, Prisma e SQLite.

## O que está implementado

- Cadastro e login com sessão HTTP-only.
- Primeiro usuário registrado recebe o papel de administrador; os demais recebem papel de membro.
- Projetos e membros iniciais do projeto.
- CRUD de tarefas com título, descrição, status, prioridade, responsável e prazo.
- Quadro Kanban com alteração de status.
- Busca e filtros por projeto, status e prioridade.
- Dashboard com tarefas totais, em andamento, concluídas e atrasadas.
- Tela de projetos e lista de tarefas.
- Visualização simples dos próximos prazos.
- Validação de entradas nas principais APIs.

## Requisitos

- Node.js 20 ou superior (recomendado).
- npm.
- Git (opcional).

## Instalação local

1. Extraia o ZIP e entre na pasta `atlas-hub`.
2. Instale as dependências:

   ```bash
   npm install
   ```

3. Crie seu arquivo de ambiente copiando `.env.example` para `.env`.

   Linux/macOS:

   ```bash
   cp .env.example .env
   ```

   PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

4. Troque `SESSION_SECRET` por uma string aleatória longa, com pelo menos 32 caracteres.
5. Crie as tabelas e gere o Prisma Client:

   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

6. Inicie a aplicação:

   ```bash
   npm run dev
   ```

7. Abra http://localhost:3000 e crie sua conta. O primeiro cadastro será administrador.

## API disponível

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET, POST /api/projects`
- `PATCH, DELETE /api/projects/:id`
- `GET, POST /api/tasks`
- `PATCH, DELETE /api/tasks/:id`

## Limitações conhecidas desta primeira versão

Este projeto é uma base funcional de MVP, não uma versão pronta para produção. A interface já permite gerenciar projetos e tarefas, mas a gestão administrativa de usuários, convites e associação de novos membros precisa ser concluída. O campo de responsável na tarefa ainda não oferece seleção de usuários pela interface. Calendário é uma lista de prazos, e notificações, comentários, anexos, relatórios exportáveis, testes automatizados e recuperação de senha ainda não estão implementados. WebRTC, IA, dependências avançadas e automações permanecem no backlog futuro.

Antes de produção, implemente limitação de tentativas de login, proteção adicional contra abuso, estratégia de recuperação de senha, logs, backups, testes automatizados e uma base de dados de produção. Configure HTTPS e um segredo de sessão forte. Para hospedagem serverless, avalie PostgreSQL em vez de SQLite.

## Próximos passos sugeridos

1. Completar gestão de usuários, convites e atribuição de responsáveis.
2. Implementar testes unitários e de integração para APIs e permissões.
3. Implementar notificações internas.
4. Acrescentar comentários e anexos com validação e armazenamento seguro.
5. Criar relatórios e calendário mensal.
6. Avaliar WebRTC somente depois de estabilizar o MVP.

## Observação de segurança

O primeiro usuário registrado recebe a função de administrador automaticamente. Para uso compartilhado, restrinja o cadastro público ou implemente um fluxo de convite antes de publicar a aplicação.
