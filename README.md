# Task Manager

Ứng dụng quản lý dự án & công việc — Next.js 14 (App Router) + Prisma (MySQL) + NextAuth + shadcn/ui.

# Quy tắc đặt tên nhánh 

- feature/tên-tính-năng 
- bugfix/sửa-lỗi
- update/cập-nhật-thêm-tính-năng

## Tech stack

- **Framework:** Next.js 14 (App Router), TypeScript
- **DB:** MySQL (Prisma 7)
- **Auth:** NextAuth v4 (Credentials, JWT, bcryptjs)
- **UI:** shadcn/ui, Tailwind CSS, lucide-react
- **Form/Validation:** react-hook-form + zod
- **Data:** TanStack Query (server state), Zustand (client state)
- **Table:** TanStack Table
- **Drag & Drop:** @dnd-kit
- **Charts:** Recharts

## Cấu trúc thư mục

```
app/
  (auth)/            # login, register — layout riêng, không sidebar
  (dashboard)/       # protected — sidebar + header (projects, tasks, users, dashboard)
  api/               # API route handlers (thin, gọi lib/)
components/
  ui/                # shadcn components (thêm bằng `npx shadcn@latest add <name>`)
  layout/            # header, sidebar, user-nav
  providers.tsx      # SessionProvider + QueryClientProvider
features/
  auth|users|projects|tasks|dashboard/
    components/ hooks/ schemas/ types/ stores/   # mỗi feature tự khép kín
lib/
  db.ts              # PrismaClient singleton (driver adapter mariadb)
  auth.ts            # NextAuth config (Credentials + JWT + role)
  env.ts             # zod env validation
  constants.ts       # ROLES, TASK_STATUSES, PRIORITIES
  query-client.ts    # TanStack Query factory
  validations/       # zod schemas (auth, user, project, task)
  workflow/          # pure functions: determineWorkflow, canTransition, canApprove
hooks/               # global hooks (useDebounce...)
stores/              # global zustand stores (nếu cần)
types/               # global types (next-auth augmentation)
prisma/
  schema.prisma      # User, Project, ProjectMember, Task + enums
  seed.ts            # seed admin/manager/member + project + tasks mẫu
middleware.ts        # bảo vệ route (chưa login → /login)
```

**Nguyên tắc:** mỗi feature tự chứa UI/hooks/schemas trong `features/<domain>/`. Thứ gì 2+ feature dùng chung → đưa lên `lib/` hoặc `components/`. API route chỉ là thin handler gọi `lib/`.

## Setup

```bash
npm install
cp .env.example .env      # rồi điền DATABASE_URL + NEXTAUTH_SECRET
npx prisma generate
npx prisma migrate dev    # tạo bảng (cần DATABASE_URL thật)
npm run db:seed           # seed dữ liệu mẫu
npm run dev
```

Tạo `NEXTAUTH_SECRET`: `openssl rand -base64 32`

## Scripts

| Script | Mô tả |
|---|---|
| `npm run dev` | Chạy dev server |
| `npm run build` | Build production |
| `npm run db:generate` | Sinh Prisma client |
| `npm run db:migrate` | Tạo migration + áp dụng |
| `npm run db:push` | Push schema (dev nhanh) |
| `npm run db:studio` | Mở Prisma Studio |
| `npm run db:seed` | Seed dữ liệu mẫu |

## Workflow 3 luồng (task approval)

Logic ở `lib/workflow/` (pure functions, test được độc lập):
- **Luồng 1:** creator ≠ assignee, assignee ≠ executor (3 người) → cần duyệt
- **Luồng 2:** creator = assignee, khác executor → cần duyệt
- **Luồng 3:** assignee = executor (tự giao tự làm) → không cần duyệt

Hàm: `determineWorkflow(task)`, `canTransition(task, user, targetStatus)`, `canApprove(task, user)`.

## Thêm component shadcn

```bash
npx shadcn@latest add button card dialog form table select dropdown-menu
```
