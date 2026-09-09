"use client"

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export type StatusChartItem = { name: string; value: number; key: string }
export type ProjectChartItem = { name: string; tasks: number }

const STATUS_COLOR: Record<string, string> = {
  PENDING_APPROVAL: "#f59e0b", TODO: "#94a3b8", IN_PROGRESS: "#3b82f6", PENDING_ACCEPTANCE: "#8b5cf6", DONE: "#22c55e", REJECTED: "#ef4444",
}

export function ChartsPanel({
  statusData,
  projectData,
}: {
  statusData: StatusChartItem[]
  projectData: ProjectChartItem[]
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="border shadow-soft">
        <CardHeader><CardTitle className="text-base font-semibold">Theo trạng thái</CardTitle></CardHeader>
        <CardContent className="h-64">
          {statusData.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">Chưa có dữ liệu</p> : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {statusData.map((e) => <Cell key={e.key} fill={STATUS_COLOR[e.key] ?? "#888"} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {projectData.length > 0 && (
        <Card className="border shadow-soft">
          <CardHeader><CardTitle className="text-base font-semibold">Theo project</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectData} layout="vertical">
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="tasks" name="Tasks" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
