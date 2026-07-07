"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileUpload } from "@/components/knowledge-base/file-upload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  BookOpen,
  Upload,
  FileText,
  Trash2,
  Search,
  Filter,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  File,
  ChevronDown,
  ChevronUp,
  Archive,
} from "lucide-react";

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  bytes: number;
  project: string;
  status: "ready" | "processing" | "error";
  uploaded: string;
  chunks?: number;
}

const ALL_TYPES = ["all", "pdf", "docx", "xlsx", "csv", "md", "txt"];

export default function KnowledgeBasePage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const data = await fetch("/api/documents").then((r) => r.json()).catch(() => null);
      if (data) { setDocuments(data); return; }
    } catch { /* fall through */ }
    // Fall back to mock data
    const timeout = setTimeout(() => {
      setDocuments(mockDocuments);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timeout);
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || doc.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: documents.length,
    processed: documents.filter((d) => d.status === "ready").length,
    processing: documents.filter((d) => d.status === "processing").length,
    error: documents.filter((d) => d.status === "error").length,
  };

  const docTypeColors: Record<string, string> = {
    pdf: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
    docx: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    xlsx: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    csv: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
    md: "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
    txt: "bg-gray-50 text-gray-600 dark:bg-gray-950 dark:text-gray-400",
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload and manage documents used for answer generation
          </p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload Documents
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Upload Documents</DialogTitle>
            </DialogHeader>
            <FileUpload
              onUploadComplete={(files) => {
                setUploadDialogOpen(false);
                loadDocuments();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Total</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Processed</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.processed}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Processing</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.processing}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Errors</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.error}</div></CardContent>
        </Card>
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1">
          {ALL_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                typeFilter === type
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              {type === "all" ? "All" : type.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Document List */}
        <div className="lg:col-span-2 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No documents found</p>
            </div>
          ) : (
            filteredDocs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className={`w-full rounded-lg border border-border p-4 text-left transition-all hover:shadow-sm ${
                  selectedDoc?.id === doc.id ? "ring-1 ring-primary" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-md ${docTypeColors[doc.type] || "bg-secondary text-muted-foreground"}`}>
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{doc.name}</p>
                      <Badge variant={doc.status === "ready" ? "success" : doc.status === "processing" ? "warning" : "destructive"}>
                        {doc.status === "ready" ? "Ready" : doc.status === "processing" ? "Processing" : "Error"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{doc.size}</span>
                      <span>·</span>
                      <span>{doc.project}</span>
                      <span>·</span>
                      <span>{doc.uploaded}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); /* delete */ }}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Document Detail Panel */}
        <div className="lg:col-span-1">
          {selectedDoc ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-md ${docTypeColors[selectedDoc.type] || "bg-secondary"}`}>
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{selectedDoc.name}</CardTitle>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <DetailRow label="Type" value={selectedDoc.type.toUpperCase()} />
                  <DetailRow label="Size" value={selectedDoc.size} />
                  <DetailRow label="Project" value={selectedDoc.project} />
                  <DetailRow label="Uploaded" value={selectedDoc.uploaded} />
                  <DetailRow label="Status" value={selectedDoc.status} />
                  {selectedDoc.chunks !== undefined && (
                    <DetailRow label="Chunks" value={`${selectedDoc.chunks}`} />
                  )}
                </div>
                <Separator />
                {selectedDoc.status === "processing" && (
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">Processing progress</p>
                    <Progress value={65} />
                  </div>
                )}
                {selectedDoc.status === "ready" && (
                  <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Document processed and ready for querying
                  </div>
                )}
                {selectedDoc.status === "error" && (
                  <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Processing failed. Try re-uploading.
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" disabled={selectedDoc.status !== "ready"}>
                    <FileText className="mr-1.5 h-3.5 w-3.5" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" disabled={selectedDoc.status !== "ready"}>
                    <Archive className="mr-1.5 h-3.5 w-3.5" />
                    Re-process
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
              <BookOpen className="mb-3 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Select a document to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

// Add mock documents to the component state
const mockDocuments: Document[] = [
  { id: "1", name: "Security_Policies_2024.pdf", type: "pdf", size: "2.4 MB", bytes: 2400000, project: "Security Compliance", status: "ready", uploaded: "2 days ago", chunks: 47 },
  { id: "2", name: "SOC2_Report_Q3.docx", type: "docx", size: "1.8 MB", bytes: 1800000, project: "Security Compliance", status: "ready", uploaded: "1 week ago", chunks: 32 },
  { id: "3", name: "Product_Whitepaper.pdf", type: "pdf", size: "5.2 MB", bytes: 5200000, project: "Acme Corp Onboarding", status: "processing", uploaded: "1 hour ago" },
  { id: "4", name: "Data_Processing_Agreement.pdf", type: "pdf", size: "890 KB", bytes: 890000, project: "Data Privacy", status: "ready", uploaded: "3 days ago", chunks: 18 },
  { id: "5", name: "Infrastructure_Diagram.pdf", type: "pdf", size: "3.1 MB", bytes: 3100000, project: "Infrastructure Review", status: "ready", uploaded: "5 days ago", chunks: 24 },
  { id: "6", name: "Incident_Response_Plan.docx", type: "docx", size: "1.2 MB", bytes: 1200000, project: "Security Compliance", status: "ready", uploaded: "2 weeks ago", chunks: 28 },
  { id: "7", name: "GDPR_Compliance_Summary.pdf", type: "pdf", size: "650 KB", bytes: 650000, project: "Data Privacy", status: "error", uploaded: "1 day ago" },
  { id: "8", name: "Network_Diagram_2024.pdf", type: "pdf", size: "4.1 MB", bytes: 4100000, project: "Infrastructure Review", status: "ready", uploaded: "3 weeks ago", chunks: 35 },
  { id: "9", name: "Vendor_Assessment_Template.xlsx", type: "xlsx", size: "380 KB", bytes: 380000, project: "Security Compliance", status: "ready", uploaded: "1 month ago", chunks: 12 },
  { id: "10", name: "README.md", type: "md", size: "12 KB", bytes: 12000, project: "Acme Corp Onboarding", status: "ready", uploaded: "2 months ago", chunks: 3 },
];
