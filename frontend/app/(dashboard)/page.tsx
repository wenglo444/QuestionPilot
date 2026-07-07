"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  FolderKanban,
  Clock,
  CheckCircle2,
  TrendingUp,
  BookOpen,
} from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of your RFP automation activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Projects
            </CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">6</div>
            <p className="mt-1 text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Questionnaires
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">24</div>
            <p className="mt-1 text-xs text-muted-foreground">
              8 completed this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Time Saved
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">47h</div>
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
              +12h from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Accuracy
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">92%</div>
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
              +3% improvement
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Questionnaires</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentQuestionnaires.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.project}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      item.status === "completed"
                        ? "success"
                        : item.status === "in_progress"
                        ? "warning"
                        : "secondary"
                    }
                  >
                    {item.status === "completed"
                      ? "Completed"
                      : item.status === "in_progress"
                      ? "In Progress"
                      : "Draft"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Knowledge Base Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Knowledge Base</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Total Documents</p>
                    <p className="text-xs text-muted-foreground">
                      Across all projects
                    </p>
                  </div>
                </div>
                <span className="text-lg font-semibold">42</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Processed</p>
                    <p className="text-xs text-muted-foreground">
                      Ready for querying
                    </p>
                  </div>
                </div>
                <span className="text-lg font-semibold">38</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Processing</p>
                    <p className="text-xs text-muted-foreground">
                      In the queue
                    </p>
                  </div>
                </div>
                <span className="text-lg font-semibold">4</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const recentQuestionnaires = [
  {
    name: "SOC 2 Type II Assessment",
    project: "Security Compliance",
    status: "completed",
  },
  {
    name: "Vendor Security Questionnaire",
    project: "Acme Corp Onboarding",
    status: "completed",
  },
  {
    name: "ISO 27001 Gap Analysis",
    project: "Security Compliance",
    status: "in_progress",
  },
  {
    name: "GDPR Compliance Checklist",
    project: "Data Privacy",
    status: "draft",
  },
  {
    name: "Cloud Security Assessment",
    project: "Infrastructure Review",
    status: "in_progress",
  },
];
