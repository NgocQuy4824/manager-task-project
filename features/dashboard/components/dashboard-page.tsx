"use client"

import React from "react"
import Link from "next/link"

import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FolderKanban,
  ListChecks,
  Loader2,
  Timer,
  TrendingUp,
  XCircle,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Badge } from "@/components/ui/badge"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Skeleton } from "@/components/ui/skeleton"

import { useStats } from "@/features/dashboard/hooks/use-stats"

import { useProjects } from "@/features/projects/hooks/use-projects"

import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
} from "@/lib/constants"

import type {
  TaskPriorityType,
  TaskStatusType,
} from "@/lib/constants"

import { ChartsPanel } from "./charts-panel"

/*
|--------------------------------------------------------------------------
| FORMAT DATE
|--------------------------------------------------------------------------
*/

function formatDate(value: string | null) {
  if (!value) {
    return "Chưa có"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Chưa có"
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

/*
|--------------------------------------------------------------------------
| FORMAT SHORT DATE
|--------------------------------------------------------------------------
*/

function formatShortDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Chưa có"
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}

/*
|--------------------------------------------------------------------------
| STATUS CLASS
|--------------------------------------------------------------------------
*/

function getStatusClass(status: string) {
  switch (status) {
    case "TODO":
      return "border-slate-200 bg-slate-50 text-slate-700"

    case "IN_PROGRESS":
      return "border-blue-200 bg-blue-50 text-blue-700"

    case "PENDING_APPROVAL":
      return "border-amber-200 bg-amber-50 text-amber-700"

    case "PENDING_ACCEPTANCE":
      return "border-purple-200 bg-purple-50 text-purple-700"

    case "DONE":
      return "border-green-200 bg-green-50 text-green-700"

    case "REJECTED":
      return "border-red-200 bg-red-50 text-red-700"

    default:
      return "border-slate-200 bg-slate-50 text-slate-700"
  }
}

/*
|--------------------------------------------------------------------------
| PRIORITY CLASS
|--------------------------------------------------------------------------
*/

function getPriorityClass(priority: string) {
  switch (priority) {
    case "LOW":
      return "border-slate-200 bg-slate-50 text-slate-700"

    case "MEDIUM":
      return "border-blue-200 bg-blue-50 text-blue-700"

    case "HIGH":
      return "border-orange-200 bg-orange-50 text-orange-700"

    case "URGENT":
      return "border-red-200 bg-red-50 text-red-700"

    default:
      return "border-slate-200 bg-slate-50 text-slate-700"
  }
}

/*
|--------------------------------------------------------------------------
| STAT CARD
|--------------------------------------------------------------------------
*/

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClass,
  iconBg,
}: {
  title: string
  value: number | string
  description: string
  icon: React.ElementType
  iconClass?: string
  iconBg?: string
}) {
  return (
    <Card className="group relative overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          {/* TEXT */}

          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>

            <p className="mt-2 text-3xl font-bold tracking-tight">
              {value}
            </p>

            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          </div>

          {/* ICON */}

          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              iconBg ?? "bg-muted"
            }`}
          >
            <Icon
              className={`h-5 w-5 ${
                iconClass ?? "text-foreground"
              }`}
            />
          </div>
        </div>

        {/* DECORATION */}

        <div className="absolute -bottom-8 -right-8 h-20 w-20 rounded-full bg-primary/5 transition-transform duration-300 group-hover:scale-150" />
      </CardContent>
    </Card>
  )
}

/*
|--------------------------------------------------------------------------
| DASHBOARD
|--------------------------------------------------------------------------
*/

export function DashboardPageContent() {
  /*
   * Project đang được chọn.
   *
   * "" = tất cả project
   */
  const [projectId, setProjectId] =
    React.useState<string>("")

  /*
   * STATS
   */

  const {
    data,
    isLoading,
    isFetching,
    error,
  } = useStats(projectId || undefined)

  /*
   * PROJECTS
   */

  const projectsQ = useProjects({
    pageSize: 100,
  })

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* HEADER */}

        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-56" />

            <Skeleton className="h-4 w-80" />
          </div>

          <Skeleton className="h-11 w-64 rounded-xl" />
        </div>

        {/* KPI */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({
            length: 8,
          }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-[145px] rounded-2xl"
            />
          ))}
        </div>

        {/* PROGRESS */}

        <Skeleton className="h-[160px] rounded-2xl" />

        {/* CHARTS */}

        <div className="grid gap-6 xl:grid-cols-2">
          <Skeleton className="h-[440px] rounded-2xl" />

          <Skeleton className="h-[440px] rounded-2xl" />
        </div>
      </div>
    )
  }

  /*
  |--------------------------------------------------------------------------
  | ERROR
  |--------------------------------------------------------------------------
  */

  if (error) {
    return (
      <Card className="rounded-2xl border-red-200 bg-red-50/50">
        <CardContent className="flex min-h-[400px] flex-col items-center justify-center p-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>

          <h2 className="mt-5 text-xl font-semibold">
            Không thể tải Dashboard
          </h2>

          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {error.message}
          </p>
        </CardContent>
      </Card>
    )
  }

  /*
  |--------------------------------------------------------------------------
  | STATS
  |--------------------------------------------------------------------------
  */

  const stats = data?.data

  if (!stats) {
    return null
  }

  /*
  |--------------------------------------------------------------------------
  | PROJECT LIST
  |--------------------------------------------------------------------------
  */

  const projects = projectsQ.data?.data ?? []

  /*
  |--------------------------------------------------------------------------
  | STATUS CHART
  |--------------------------------------------------------------------------
  |
  | QUAN TRỌNG:
  |
  | Biểu đồ luôn có ĐỦ 6 trạng thái:
  |
  | 1. Cần làm
  | 2. Đang làm
  | 3. Chờ duyệt
  | 4. Chờ nghiệm thu
  | 5. Hoàn thành
  | 6. Từ chối
  |
  | Không dùng .filter() để loại bỏ trạng thái = 0.
  |
  |--------------------------------------------------------------------------
  */

  const statusOrder = [
    "TODO",
    "IN_PROGRESS",
    "PENDING_APPROVAL",
    "PENDING_ACCEPTANCE",
    "DONE",
    "REJECTED",
  ]

  const statusData = statusOrder.map(
    (status) => {
      const found = stats.byStatus.find(
        (item) =>
          item.status === status
      )

      return {
        name:
          TASK_STATUS_LABELS[
            status as TaskStatusType
          ] ?? status,

        value: found?.count ?? 0,

        key: status,
      }
    }
  )

  /*
  |--------------------------------------------------------------------------
  | PROJECT LIST
  |--------------------------------------------------------------------------
  */

  const projectList = projects

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-6">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        {/* TITLE */}

        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                  Tổng quan
                </h1>

                {isFetching && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                Theo dõi tình hình công việc và tiến độ
                các project.
              </p>
            </div>
          </div>
        </div>

        {/* PROJECT SELECT */}

        <div className="w-full lg:w-[280px]">
          <Select
            value={projectId || "all"}
            onValueChange={(value) =>
              setProjectId(
                value === "all"
                  ? ""
                  : value
              )
            }
          >
            <SelectTrigger className="h-11 rounded-xl border bg-card shadow-sm">
              <SelectValue placeholder="Tất cả project" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">
                Tất cả project
              </SelectItem>

              {projectList.map(
                (project: {
                  id: string
                  name: string
                }) => (
                  <SelectItem
                    key={project.id}
                    value={project.id}
                  >
                    {project.name}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* =====================================================
          PRIMARY KPI
      ====================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* TOTAL PROJECTS */}

        <StatCard
          title="Tổng Projects"
          value={stats.totalProjects}
          description="Project bạn có quyền truy cập"
          icon={FolderKanban}
          iconClass="text-violet-600"
          iconBg="bg-violet-100"
        />

        {/* TOTAL TASKS */}

        <StatCard
          title="Tổng Tasks"
          value={stats.totalTasks}
          description="Tất cả công việc hiện tại"
          icon={ListChecks}
          iconClass="text-blue-600"
          iconBg="bg-blue-100"
        />

        {/* PENDING APPROVAL */}

        <StatCard
          title="Chờ duyệt"
          value={stats.pendingApproval}
          description="Task cần được phê duyệt"
          icon={Clock3}
          iconClass="text-amber-600"
          iconBg="bg-amber-100"
        />

        {/* DONE */}

        <StatCard
          title="Hoàn thành"
          value={stats.done}
          description={`${stats.completionRate}% tổng số task`}
          icon={CheckCircle2}
          iconClass="text-green-600"
          iconBg="bg-green-100"
        />
      </div>

      {/* =====================================================
          SECONDARY KPI
      ====================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* IN PROGRESS */}

        <StatCard
          title="Đang làm"
          value={stats.inProgress}
          description="Task đang được thực hiện"
          icon={TrendingUp}
          iconClass="text-blue-600"
          iconBg="bg-blue-100"
        />

        {/* PENDING ACCEPTANCE */}

        <StatCard
          title="Chờ nghiệm thu"
          value={stats.pendingAcceptance}
          description="Task chờ xác nhận hoàn thành"
          icon={Timer}
          iconClass="text-purple-600"
          iconBg="bg-purple-100"
        />

        {/* UPCOMING */}

        <StatCard
          title="Sắp đến hạn"
          value={stats.upcomingTasks}
          description="Trong vòng 7 ngày tới"
          icon={CalendarDays}
          iconClass="text-orange-600"
          iconBg="bg-orange-100"
        />

        {/* OVERDUE */}

        <StatCard
          title="Quá hạn"
          value={stats.overdueTasks}
          description="Task chưa hoàn thành và đã quá hạn"
          icon={XCircle}
          iconClass="text-red-600"
          iconBg="bg-red-100"
        />
      </div>

      {/* =====================================================
          PROGRESS
      ====================================================== */}

      <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <CardContent className="p-6 md:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>

                <h2 className="text-lg font-semibold">
                  Tiến độ hoàn thành
                </h2>
              </div>

              <p className="mt-2 text-sm text-muted-foreground">
                Tổng quan tỷ lệ task đã hoàn thành
              </p>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-3xl font-bold tracking-tight">
                {stats.completionRate}%
              </p>

              <p className="text-xs text-muted-foreground">
                {stats.done}/{stats.totalTasks} task
              </p>
            </div>
          </div>

          {/* PROGRESS BAR */}

          <div className="mt-6">
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      stats.completionRate
                    )
                  )}%`,
                }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {stats.done} task hoàn thành
              </span>

              <span>
                {stats.totalTasks} task tổng cộng
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* =====================================================
          ROW 1
          STATUS + UPCOMING
      ====================================================== */}

      <div className="grid items-stretch gap-6 xl:grid-cols-2">
        {/* =================================================
            STATUS CHART
        ================================================== */}

        <ChartsPanel
          statusData={statusData}
        />

        {/* =================================================
            UPCOMING TASKS
        ================================================== */}

        <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <CardHeader className="border-b bg-muted/20 px-6 py-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg">
                  Sắp đến hạn
                </CardTitle>

                <p className="mt-1 text-xs text-muted-foreground">
                  Công việc cần chú ý trong thời gian tới
                </p>
              </div>

              <Link
                href="/tasks"
                className="group flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
              >
                Xem tất cả

                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            {stats.upcomingTaskList.length === 0 ? (
              /*
               * EMPTY
               */
              <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>

                <p className="mt-4 text-sm font-medium">
                  Không có task sắp đến hạn
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Hiện tại bạn không có task cần xử lý gấp
                </p>
              </div>
            ) : (
              /*
               * TASK LIST
               */
              <div className="space-y-2">
                {stats.upcomingTaskList.map(
                  (task) => (
                    <Link
                      key={task.id}
                      href={`/tasks/${task.id}`}
                      className="group block rounded-xl border p-4 transition-all hover:border-primary/30 hover:bg-muted/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium transition-colors group-hover:text-primary">
                            {task.title}
                          </p>

                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {task.project?.name ??
                              "Project không tồn tại"}
                          </p>
                        </div>

                        <Badge
                          variant="outline"
                          className={`shrink-0 ${getPriorityClass(
                            task.priority
                          )}`}
                        >
                          {TASK_PRIORITY_LABELS[
                            task.priority as TaskPriorityType
                          ] ?? task.priority}
                        </Badge>
                      </div>

                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarDays className="h-4 w-4" />

                        <span>
                          Hạn:{" "}
                          {formatShortDate(
                            task.dueDate
                          )}
                        </span>
                      </div>
                    </Link>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* =====================================================
          ROW 2
          RECENT TASKS + ACTIVITY
      ====================================================== */}

      <div className="grid items-stretch gap-6 xl:grid-cols-2">
        {/* =================================================
            RECENT TASKS
        ================================================== */}

        <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <CardHeader className="border-b bg-muted/20 px-6 py-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg">
                  Task cập nhật gần đây
                </CardTitle>

                <p className="mt-1 text-xs text-muted-foreground">
                  Những công việc vừa được cập nhật
                </p>
              </div>

              <Link
                href="/tasks"
                className="group flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
              >
                Xem tất cả

                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            {stats.recentTasks.length === 0 ? (
              /*
               * EMPTY
               */
              <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                  <ListChecks className="h-6 w-6 text-muted-foreground" />
                </div>

                <p className="mt-4 text-sm font-medium">
                  Chưa có task
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Các task gần đây sẽ xuất hiện ở đây
                </p>
              </div>
            ) : (
              /*
               * TASK LIST
               */
              <div className="space-y-2">
                {stats.recentTasks.map(
                  (task) => (
                    <Link
                      key={task.id}
                      href={`/tasks/${task.id}`}
                      className="group block rounded-xl border p-4 transition-all hover:border-primary/30 hover:bg-muted/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium transition-colors group-hover:text-primary">
                            {task.title}
                          </p>

                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {task.project?.name ??
                              "Project không tồn tại"}
                          </p>
                        </div>

                        <Badge
                          variant="outline"
                          className={`shrink-0 ${getStatusClass(
                            task.status
                          )}`}
                        >
                          {TASK_STATUS_LABELS[
                            task.status as TaskStatusType
                          ] ?? task.status}
                        </Badge>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={getPriorityClass(
                            task.priority
                          )}
                        >
                          {TASK_PRIORITY_LABELS[
                            task.priority as TaskPriorityType
                          ] ?? task.priority}
                        </Badge>

                        <span className="text-xs text-muted-foreground">
                          Cập nhật{" "}
                          {formatDate(
                            task.updatedAt
                          )}
                        </span>
                      </div>
                    </Link>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* =================================================
            RECENT ACTIVITY
        ================================================== */}

        <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <CardHeader className="border-b bg-muted/20 px-6 py-5">
            <div>
              <CardTitle className="text-lg">
                Hoạt động gần đây
              </CardTitle>

              <p className="mt-1 text-xs text-muted-foreground">
                Lịch sử thay đổi trạng thái công việc
              </p>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {stats.recentActivities.length === 0 ? (
              /*
               * EMPTY
               */
              <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                  <Clock3 className="h-6 w-6 text-muted-foreground" />
                </div>

                <p className="mt-4 text-sm font-medium">
                  Chưa có hoạt động
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Hoạt động mới sẽ xuất hiện ở đây
                </p>
              </div>
            ) : (
              /*
               * TIMELINE
               */
              <div className="relative space-y-6">
                {/* TIMELINE LINE */}

                <div className="absolute bottom-4 left-[17px] top-4 w-px bg-border" />

                {stats.recentActivities.map(
                  (activity) => (
                    <div
                      key={activity.id}
                      className="relative flex gap-4"
                    >
                      {/* ICON */}

                      <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-card shadow-sm">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                          {activity.to === "DONE" ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : activity.to === "REJECTED" ? (
                            <XCircle className="h-4 w-4 text-red-600" />
                          ) : (
                            <TrendingUp className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </div>

                      {/* CONTENT */}

                      <div className="min-w-0 flex-1 pb-1">
                        {/* ACTIVITY TEXT */}

                        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
                          <span className="font-semibold">
                            {activity.actor?.name ??
                              activity.actor?.email ??
                              "Người dùng"}
                          </span>

                          <span className="text-muted-foreground">
                            đã cập nhật
                          </span>

                          <Link
                            href={`/tasks/${activity.taskId}`}
                            className="font-semibold text-primary hover:underline"
                          >
                            {activity.taskTitle}
                          </Link>
                        </div>

                        {/* STATUS */}

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {activity.from && (
                            <>
                              <Badge
                                variant="outline"
                                className={`text-xs ${getStatusClass(
                                  activity.from
                                )}`}
                              >
                                {TASK_STATUS_LABELS[
                                  activity.from as TaskStatusType
                                ] ??
                                  activity.from}
                              </Badge>

                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            </>
                          )}

                          <Badge
                            variant="outline"
                            className={`text-xs ${getStatusClass(
                              activity.to
                            )}`}
                          >
                            {TASK_STATUS_LABELS[
                              activity.to as TaskStatusType
                            ] ?? activity.to}
                          </Badge>

                          <span className="text-xs text-muted-foreground">
                            {formatDate(
                              activity.createdAt
                            )}
                          </span>
                        </div>

                        {/* REASON */}

                        {activity.reason && (
                          <div className="mt-3 flex gap-2 rounded-xl bg-muted/50 p-3">
                            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

                            <p className="text-xs leading-5 text-muted-foreground">
                              {activity.reason}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}