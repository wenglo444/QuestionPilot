"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Upload, ArrowUpRight, MoreHorizontal } from "lucide-react";

export default function QuestionnairesPage() {
  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Questionnaires</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View and manage all your questionnaires
          </p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Import Questionnaire
        </Button>
      </div>

      {/* Questionnaire List */}
      <div className="space-y-3">
        {questionnaires.map((item) => (
          <Card
            key={item.name}
            className="transition-all hover:shadow-sm"
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{item.name}</p>
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
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{item.project}</span>
                  <span>·</span>
                  <span>{item.questions} questions</span>
                  <span>·</span>
                  <span>Updated {item.updated}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {item.status === "completed" && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">
                    {item.acceptance}% acceptance
                  </span>
                )}
                <Button variant="ghost" size="icon">
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

const questionnaires = [
  {
    name: "SOC 2 Type II Assessment",
    project: "Security Compliance",
    questions: 145,
    status: "completed",
    acceptance: 94,
    updated: "2 days ago",
  },
  {
    name: "Vendor Security Questionnaire",
    project: "Acme Corp Onboarding",
    questions: 89,
    status: "completed",
    acceptance: 91,
    updated: "1 week ago",
  },
  {
    name: "ISO 27001 Gap Analysis",
    project: "Security Compliance",
    questions: 210,
    status: "in_progress",
    acceptance: 0,
    updated: "3 days ago",
  },
  {
    name: "GDPR Compliance Checklist",
    project: "Data Privacy",
    questions: 67,
    status: "draft",
    acceptance: 0,
    updated: "Just now",
  },
  {
    name: "Cloud Security Assessment",
    project: "Infrastructure Review",
    questions: 120,
    status: "in_progress",
    acceptance: 0,
    updated: "5 hours ago",
  },
  {
    name: "CAIQ v4 Assessment",
    project: "Security Compliance",
    questions: 350,
    status: "completed",
    acceptance: 96,
    updated: "2 weeks ago",
  },
  {
    name: "Standard Vendor Assessment",
    project: "Acme Corp Onboarding",
    questions: 45,
    status: "completed",
    acceptance: 88,
    updated: "1 month ago",
  },
];
