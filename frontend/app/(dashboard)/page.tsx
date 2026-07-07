"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import {
  FileText,
  FolderKanban,
  Clock,
  CheckCircle2,
  TrendingUp,
  BookOpen,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

// Mock data for charts (will be replaced with API calls)
const completionData = [
  { day: "Oct 10", completed: 0, total: 5 },
  { day: "Oct 12", completed: 1, total: 8 },
  { day: "Oct 14", completed: 2, total: 12 },
  { day: "Oct 16", completed: 3, total: 15 },
  { day: "Oct 18", completed: 5, total: 18 },
  { day: "Oct 20", completed: 7, total: 20 },
  { day: "Oct 22", completed: 10, total: 22 },
  { day: "Oct 24", completed: 14, total: 25 },
  { day: "Oct 26", completed: 18, total: 28 },
  { day: "Oct 28", completed: 22, total: 30 },
  { day: "Oct 30", completed: 24, total: 32 },
  { day: "Nov 1", completed: 24, total: 32 },
];

const docTypeData = [
  { type: "PDF", count: 24, fill: "#3b82f6" },
  { type: "DOCX", count: 10, fill: "#8b5cf6" },
  { type: "XLSX", count: 5, fill: "#10b981" },
  { type: "CSV", count: 2, fill: "#f59e0b" },
  { type: "MD", count: 3, fill: "#ef4444" },
  { type: "TXT", count: 1, fill: "#6366f1" },
];

const reviewStatusData = [
  { name: "Approved", value: 142, color: "#10b981" },
  { name: "Pending", value: 89, color: "#6b7280" },
  { name: "Edited", value: 34, color: "#f59e0b" },
  { name: "Rejected", value: 12, color: "#ef4444" },
];

const recentActivity = [
  { action: "Questionnaire completed", name: "SOC 2 Type II Assessment", time: "2 hours ago", user: "You" },
  { action: "Document processed", name: "Security_Policies_2024.pdf", time: "4 hours ago", user: "System" },
  { action: "Answers generated", name: "Vendor Security Questionnaire", time: "1 day ago", user: "AI" },
  { action: "Project created", name: "Data Privacy Review", time: "2 days ago", user: "You" },
  { action: "Document uploaded", name: "GDPR_Compliance_Summary.pdf", time: "3 days ago", user: "You" },
  { action: "Questionnaire imported", name: "ISO 27001 Gap Analysis", time: "4 days ago", user: "Team" },
  { action: "Answer approved", name: "SOC 2 Type II - Q42", time: "5 days ago", user: "You" },
];

interface DashboardStats {
  activeProjects: number;
  totalQuestionnaires: number;
  timeSaved: number;
  avgConfidence: number;
  documentsIndexed: number;
  documentsProcessing: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try API first, fall back to mock data
      const data = await api.get<DashboardStats>("/api/dashboard/stats");
      setStats(data);
    } catch {
      // Use mock data as fallback
      setStats({
        activeProjects: 6,
        totalQuestionnaires: 24,
        timeSaved: 47,
        avgConfidence: 92,
        documentsIndexed: 38,
        documentsProcessing: 4,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="mb-4 h-12 w-12 text-destructive/40" />
        <p className="mb-4 text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={loadStats}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of your RFP automation activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Projects"
          value={stats?.activeProjects ?? 0}
          subtitle="+2 from last month"
          icon={FolderKanban}
        />
        <StatCard
          title="Questionnaires"
          value={stats?.totalQuestionnaires ?? 0}
          subtitle="8 completed this month"
          icon={FileText}
        />
        <StatCard
          title="Time Saved"
          value={`${stats?.timeSaved ?? 0}h`}
          subtitle="+12h from last week"
          icon={Clock}
          trend="up"
        />
        <StatCard
          title="Avg. Confidence"
          value={`${stats?.avgConfidence ?? 0}%`}
          subtitle="+3% improvement"
          icon={TrendingUp}
          trend="up"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Line Chart - Questionnaires Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Questionnaires Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={completionData}>
                  <defs>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorCompleted)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart - Documents by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Documents by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={docTypeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="type" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={32}>
                    {docTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Donut Chart - Review Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Review Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="h-[200px] w-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reviewStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {reviewStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {reviewStatusData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2 text-sm">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-muted-foreground">{entry.name}</span>
                    <span className="ml-auto font-medium">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs">
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary/40" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{item.action}</span>
                      {" — "}
                      <span className="text-muted-foreground">{item.name}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.time} · {item.user}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  trend?: "up" | "down";
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <p className={`mt-1 text-xs ${trend === "up" ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
          {subtitle}
        </p>
      </CardContent>
    </Card>
  );
}