"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Upload, FileText, Trash2, Plus } from "lucide-react";

export default function KnowledgeBasePage() {
  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload and manage documents used for answer generation
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            New Folder
          </Button>
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload Documents
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Processed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              38
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Processing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              4
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents List */}
      <div className="space-y-3">
        {documents.map((doc) => (
          <Card key={doc.name} className="transition-all hover:shadow-sm">
            <CardContent className="flex items-center gap-4 p-4">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  doc.type === "pdf"
                    ? "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
                    : doc.type === "docx"
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                    : "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
                }`}
              >
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{doc.name}</p>
                  <Badge
                    variant={
                      doc.status === "ready"
                        ? "success"
                        : doc.status === "processing"
                        ? "warning"
                        : "secondary"
                    }
                  >
                    {doc.status === "ready"
                      ? "Ready"
                      : doc.status === "processing"
                      ? "Processing"
                      : "Error"}
                  </Badge>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{doc.size}</span>
                  <span>·</span>
                  <span>{doc.project}</span>
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
      </div>
    </div>
  );
}

const documents = [
  {
    name: "Security_Policies_2024.pdf",
    type: "pdf",
    size: "2.4 MB",
    project: "Security Compliance",
    status: "ready",
    uploaded: "2 days ago",
  },
  {
    name: "SOC2_Report_Q3.docx",
    type: "docx",
    size: "1.8 MB",
    project: "Security Compliance",
    status: "ready",
    uploaded: "1 week ago",
  },
  {
    name: "Product_Whitepaper.pdf",
    type: "pdf",
    size: "5.2 MB",
    project: "Acme Corp Onboarding",
    status: "processing",
    uploaded: "1 hour ago",
  },
  {
    name: "Data_Processing_Agreement.pdf",
    type: "pdf",
    size: "890 KB",
    project: "Data Privacy",
    status: "ready",
    uploaded: "3 days ago",
  },
  {
    name: "Infrastructure_Diagram.pdf",
    type: "pdf",
    size: "3.1 MB",
    project: "Infrastructure Review",
    status: "ready",
    uploaded: "5 days ago",
  },
  {
    name: "Incident_Response_Plan.docx",
    type: "docx",
    size: "1.2 MB",
    project: "Security Compliance",
    status: "ready",
    uploaded: "2 weeks ago",
  },
  {
    name: "GDPR_Compliance_Summary.pdf",
    type: "pdf",
    size: "650 KB",
    project: "Data Privacy",
    status: "error",
    uploaded: "1 day ago",
  },
];
