"use client"

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

/*
|--------------------------------------------------------------------------
| DATA TYPE
|--------------------------------------------------------------------------
*/

export type StatusChartItem = {
  name: string
  value: number
  key: string
}

/*
|--------------------------------------------------------------------------
| STATUS COLORS
|--------------------------------------------------------------------------
|
| TODO                = Cần làm
| IN_PROGRESS         = Đang làm
| PENDING_APPROVAL    = Chờ duyệt
| PENDING_ACCEPTANCE  = Chờ nghiệm thu
| DONE                = Hoàn thành
| REJECTED            = Từ chối
|
|--------------------------------------------------------------------------
*/

const STATUS_COLORS: Record<string, string> = {
  TODO: "#94a3b8",
  IN_PROGRESS: "#3b82f6",
  PENDING_APPROVAL: "#f59e0b",
  PENDING_ACCEPTANCE: "#8b5cf6",
  DONE: "#22c55e",
  REJECTED: "#ef4444",
}

/*
|--------------------------------------------------------------------------
| TOOLTIP STYLE
|--------------------------------------------------------------------------
*/

const tooltipStyle = {
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
  backgroundColor: "#ffffff",
  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
}

/*
|--------------------------------------------------------------------------
| CUSTOM LEGEND
|--------------------------------------------------------------------------
*/

function CustomLegend({
  payload,
}: {
  payload?: Array<{
    value?: string
    color?: string
    payload?: {
      key?: string
      value?: number
    }
  }>
}) {
  if (!payload || payload.length === 0) {
    return null
  }

  return (
    <div className="mx-auto mt-1 grid w-full max-w-md grid-cols-2 gap-x-6 gap-y-3 px-2 sm:grid-cols-3">
      {payload.map((item, index) => {
        const count = item.payload?.value ?? 0

        return (
          <div
            key={`${item.value}-${index}`}
            className="flex min-w-0 items-center gap-2"
          >
            {/* DOT */}
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{
                backgroundColor:
                  item.color ?? "#64748b",
              }}
            />

            {/* NAME */}
            <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
              {item.value}
            </span>

            {/* COUNT */}
            <span className="shrink-0 text-xs font-semibold text-foreground">
              {count}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/*
|--------------------------------------------------------------------------
| CHARTS PANEL
|--------------------------------------------------------------------------
*/

export function ChartsPanel({
  statusData,
}: {
  statusData: StatusChartItem[]
}) {
  /*
   * Tổng số task.
   *
   * Tính trực tiếp từ dữ liệu biểu đồ để đảm bảo
   * số ở giữa biểu đồ luôn khớp với biểu đồ.
   */
  const totalTasks = statusData.reduce(
    (total, item) => total + item.value,
    0
  )

  return (
    <Card className="h-full overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <CardHeader className="border-b bg-muted/20 px-6 py-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg font-semibold">
              Task theo trạng thái
            </CardTitle>

            <p className="mt-1 text-xs text-muted-foreground">
              Phân bổ công việc theo trạng thái hiện tại
            </p>
          </div>

          <div className="shrink-0 rounded-xl bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-600">
            Trạng thái
          </div>
        </div>
      </CardHeader>

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <CardContent className="p-5">
        {totalTasks === 0 ? (
          /*
           * EMPTY STATE
           */
          <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <span className="text-2xl">
                📊
              </span>
            </div>

            <p className="mt-4 text-sm font-semibold">
              Chưa có dữ liệu
            </p>

            <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
              Khi có công việc, biểu đồ trạng thái
              sẽ được hiển thị tại đây.
            </p>
          </div>
        ) : (
          /*
           * CHART
           */
          <div className="relative">
            <div className="relative h-[370px]">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  {/* =================================================
                      DONUT
                  ================================================== */}

                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="42%"
                    outerRadius={108}
                    innerRadius={68}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {statusData.map((item) => (
                      <Cell
                        key={item.key}
                        fill={
                          STATUS_COLORS[item.key] ??
                          "#64748b"
                        }
                      />
                    ))}
                  </Pie>

                  {/* =================================================
                      TOOLTIP
                  ================================================== */}

                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => [
                      `${value} task`,
                      "Số lượng",
                    ]}
                  />

                  {/* =================================================
                      LEGEND
                  ================================================== */}

                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    content={<CustomLegend />}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* =================================================
                  CENTER OF DONUT
              ================================================== */}

              <div className="pointer-events-none absolute left-1/2 top-[40%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center">
                <span className="text-3xl font-bold tracking-tight">
                  {totalTasks}
                </span>

                <span className="mt-1 text-xs text-muted-foreground">
                  Tổng task
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}