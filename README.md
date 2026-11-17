# Atlas Hub

**Sistema de gerenciamento de tarefas desenvolvido para a ATLAS — Soluções em Tecnologia.**

O Atlas Hub é uma aplicação web para organizar projetos, membros e tarefas, permitindo acompanhar o andamento das atividades por meio de um quadro Kanban e de um dashboard.

## Tecnologias utilizadas

- **Frontend:** Next.js, React e TypeScript
- **ORM:** Prisma
- **Banco de dados:** SQLite
- **Gerenciador de pacotes:** npm
- **Versionamento:** Git e GitHub

## Funcionalidades implementadas

### Usuários e autenticação
- Cadastro e login de usuários.
- Primeiro usuário registrado recebe automaticamente a função de administrador.
- Logout.

### Projetos e membros
- Visualização dos projetos.
- Listagem de membros associados aos projetos.

### Gerenciamento de tarefas
- Criação, edição e exclusão de tarefas.
- Definição de título, descrição, status, prioridade, responsável e prazo.
- Alteração de status das tarefas.
- Filtros por projeto, status e prioridade.

### Organização e acompanhamento
- Quadro Kanban para acompanhar o andamento das tarefas.
- Dashboard com totais de tarefas, atividades em andamento, concluídas e atrasadas.
- Visualização dos próximos prazos.

##  API disponível

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/api/auth/register` | Cadastro de usuários |
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/logout` | Logout |
| `GET` | `/api/auth/me` | Dados do usuário autenticado |
| `GET` | `/api/projects` | Listagem de projetos |
| `POST` | `/api/projects` | Criação de projetos |
| `PATCH` | `/api/projects/:id` | Atualização de projetos |
| `DELETE` | `/api/projects/:id` | Exclusão de projetos |
| `GET` | `/api/tasks` | Listagem de tarefas |
| `POST` | `/api/tasks` | Criação de tarefas |
| `PATCH` | `/api/tasks/:id` | Atualização de tarefas |
| `DELETE` | `/api/tasks/:id` | Exclusão de tarefas |



OBS: O primeiro usuário registrado recebe automaticamente a função de administrador.

---


