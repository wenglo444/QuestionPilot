"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  FolderKanban,
  FileText,
  BookOpen,
  Clock,
  Upload,
  Plus,
  MoreHorizontal,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

const mockProject = {
  id: "1",
  name: "Security Compliance",
  description: "SOC 2, ISO 27001, and related security assessments",
  status: "active",
  createdAt: "Jan 15, 2024",
  questionnaireCount: 5,
  documentCount: 12,
};

const mockQuestionnaires = [
  { id: "q1", name: "SOC 2 Type II Assessment", questions: 145, status: "completed", acceptance: 94, updated: "2 days ago" },
  { id: "q2", name: "ISO 27001 Gap Analysis", questions: 210, status: "in_progress", acceptance: 0, updated: "3 days ago" },
  { id: "q3", name: "CAIQ v4 Assessment", questions: 350, status: "completed", acceptance: 96, updated: "2 weeks ago" },
  { id: "q4", name: "Cloud Security Assessment", questions: 120, status: "in_progress", acceptance: 0, updated: "5 hours ago" },
  { id: "q5", name: "Standard Vendor Assessment", questions: 45, status: "completed", acceptance: 88, updated: "1 month ago" },
];

const mockDocuments = [
  { id: "d1", name: "Security_Policies_2024.pdf", type: "pdf", size: "2.4 MB", status: "ready", uploaded: "2 days ago" },
  { id: "d2", name: "SOC2_Report_Q3.docx", type: "docx", size: "1.8 MB", status: "ready", uploaded: "1 week ago" },
  { id: "d3", name: "Incident_Response_Plan.docx", type: "docx", size: "1.2 MB", status: "ready", uploaded: "2 weeks ago" },
  { id: "d4", name: "Vendor_Assessment_Template.xlsx", type: "xlsx", size: "380 KB", status: "ready", uploaded: "1 month ago" },
];

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredQs = mockQuestionnaires.filter((q) =>
    q.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredDocs = mockDocuments.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push("/projects")}
        className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </button>

      {/* Project Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <FolderKanban className="h-7 w-7 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{mockProject.name}</h1>
              <Badge variant="success">Active</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{mockProject.description}</p>
            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
              <span>Created {mockProject.createdAt}</span>
              <span>·</span>
              <span>{mockProject.questionnaireCount} questionnaires</span>
              <span>·</span>
              <span>{mockProject.documentCount} documents</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="mr-1.5 h-4 w-4" />
            Import
          </Button>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Questionnaires</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{mockProject.questionnaireCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Completed</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">3</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Documents</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{mockProject.documentCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Avg. Acceptance</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">93%</div></CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search questionnaires and documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="questionnaires" className="space-y-4">
        <TabsList>
          <TabsTrigger value="questionnaires">
            <FileText className="mr-2 h-4 w-4" />
            Questionnaires
          </TabsTrigger>
          <TabsTrigger value="documents">
            <BookOpen className="mr-2 h-4 w-4" />
            Documents
          </TabsTrigger>
        </TabsList>

        {/* Questionnaires Tab */}
        <TabsContent value="questionnaires" className="space-y-3">
          {filteredQs.map((q) => (
            <Card key={q.id} className="transition-all hover:shadow-sm">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{q.name}</p>
                    <Badge variant={q.status === "completed" ? "success" : q.status === "in_progress" ? "warning" : "secondary"}>
                      {q.status === "completed" ? "Completed" : q.status === "in_progress" ? "In Progress" : "Draft"}
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{q.questions} questions</span>
                    <span>·</span>
                    <span>Updated {q.updated}</span>
                  </div>
                </div>
                {q.status === "completed" && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">{q.acceptance}% acceptance</span>
                )}
                <Button variant="ghost" size="sm" onClick={() => router.push(`/questionnaires/${q.id}`)}>
                  Open
                </Button>
              </CardContent>
            </Card>
          ))}
          {filteredQs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="mb-3 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No questionnaires found</p>
            </div>
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-3">
          {filteredDocs.map((doc) => (
            <Card key={doc.id} className="transition-all hover:shadow-sm">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{doc.name}</p>
                    <Badge variant={doc.status === "ready" ? "success" : doc.status === "processing" ? "warning" : "destructive"}>
                      {doc.status === "ready" ? "Ready" : doc.status === "processing" ? "Processing" : "Error"}
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{doc.size}</span>
                    <span>·</span>
                    <span>.{doc.type}</span>
                    <span>·</span>
                    <span>Uploaded {doc.uploaded}</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
          {filteredDocs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="mb-3 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No documents found</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}