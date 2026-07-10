"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Upload, ArrowUpRight, MoreHorizontal, ClipboardList } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

const defaultQuestionnaires = [
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

export default function QuestionnairesPage() {
  const [questionnaires] = useState(defaultQuestionnaires);
  const [showEmpty, setShowEmpty] = useState(false);

  const displayed = showEmpty ? [] : questionnaires;

  return (
    <div className="p-4 md:p-6">
      {/* Page Header */}
      <div className="mb-6 md:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Questionnaires</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View and manage all your questionnaires
          </p>
        </div>
        <Button size="sm" className="w-full sm:w-auto">
          <Upload className="mr-2 h-4 w-4" />
          Import Questionnaire
        </Button>
      </div>

      {displayed.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No questionnaires imported"
          description="Import an RFP, security questionnaire, or compliance assessment to get started with AI-powered answers."
          actionLabel="Import Questionnaire"
          onAction={() => {}}
        />
      ) : (
        /* Questionnaire List */
        <div className="space-y-3">
          {displayed.map((item) => (
            <Card key={item.name} className="transition-all hover:shadow-sm">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <Badge
                      variant={
                        item.status === "completed"
                          ? "success"
                          : item.status === "in_progress"
                          ? "warning"
                          : "secondary"
                      }
                      className="w-fit"
                    >
                      {item.status === "completed"
                        ? "Completed"
                        : item.status === "in_progress"
                        ? "In Progress"
                        : "Draft"}
                    </Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{item.project}</span>
                    <span className="hidden xs:inline">·</span>
                    <span>{item.questions} questions</span>
                    <span className="hidden xs:inline">·</span>
                    <span>Updated {item.updated}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.status === "completed" && (
                    <span className="hidden sm:inline text-xs text-emerald-600 dark:text-emerald-400">
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
      )}
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { FileText, Upload, ArrowUpRight, MoreHorizontal, Search, Loader2, AlertCircle } from "lucide-react";

interface Questionnaire {
  id: string;
  name: string;
  project: string;
  projectId: string;
  questions: number;
  status: "completed" | "in_progress" | "draft";
  acceptance: number;
  updated: string;
}

const mockData: Questionnaire[] = [
  { id: "1", name: "SOC 2 Type II Assessment", project: "Security Compliance", projectId: "1", questions: 145, status: "completed", acceptance: 94, updated: "2 days ago" },
  { id: "2", name: "Vendor Security Questionnaire", project: "Acme Corp Onboarding", projectId: "2", questions: 89, status: "completed", acceptance: 91, updated: "1 week ago" },
  { id: "3", name: "ISO 27001 Gap Analysis", project: "Security Compliance", projectId: "1", questions: 210, status: "in_progress", acceptance: 0, updated: "3 days ago" },
  { id: "4", name: "GDPR Compliance Checklist", project: "Data Privacy", projectId: "3", questions: 67, status: "draft", acceptance: 0, updated: "Just now" },
  { id: "5", name: "Cloud Security Assessment", project: "Infrastructure Review", projectId: "4", questions: 120, status: "in_progress", acceptance: 0, updated: "5 hours ago" },
  { id: "6", name: "CAIQ v4 Assessment", project: "Security Compliance", projectId: "1", questions: 350, status: "completed", acceptance: 96, updated: "2 weeks ago" },
  { id: "7", name: "Standard Vendor Assessment", project: "Acme Corp Onboarding", projectId: "2", questions: 45, status: "completed", acceptance: 88, updated: "1 month ago" },
];

export default function QuestionnairesPage() {
  const router = useRouter();
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadQuestionnaires();
  }, []);

  const loadQuestionnaires = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Questionnaire[]>("/api/questionnaires");
      setQuestionnaires(data);
    } catch {
      // Fall back to mock data
      setTimeout(() => {
        setQuestionnaires(mockData);
        setLoading(false);
      }, 300);
      return;
    }
    setLoading(false);
  };

  const filtered = questionnaires.filter((q) =>
    q.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.project.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (error) return (
    <div className="flex flex-col items-center justify-center py-20">
      <AlertCircle className="mb-4 h-12 w-12 text-destructive/40" />
      <p className="mb-4 text-sm text-muted-foreground">{error}</p>
      <Button variant="outline" onClick={loadQuestionnaires}>Retry</Button>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Questionnaires</h1>
          <p className="mt-1 text-sm text-muted-foreground">View and manage all your questionnaires</p>
        </div>
        <Button><Upload className="mr-2 h-4 w-4" />Import Questionnaire</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search questionnaires..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
      </div>

      <div className="space-y-3">
        {filtered.map((item) => (
          <Card key={item.id} className="transition-all hover:shadow-sm cursor-pointer" onClick={() => router.push(`/questionnaires/${item.id}`)}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{item.name}</p>
                  <Badge variant={item.status === "completed" ? "success" : item.status === "in_progress" ? "warning" : "secondary"}>
                    {item.status === "completed" ? "Completed" : item.status === "in_progress" ? "In Progress" : "Draft"}
                  </Badge>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{item.project}</span><span>·</span><span>{item.questions} questions</span><span>·</span><span>Updated {item.updated}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {item.status === "completed" && <span className="text-xs text-emerald-600 dark:text-emerald-400">{item.acceptance}% acceptance</span>}
                <Button variant="ghost" size="icon"><ArrowUpRight className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No questionnaires found</p>
          </div>
        )}
      </div>
    </div>
  );
}