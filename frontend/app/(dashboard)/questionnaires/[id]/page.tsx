"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { QuestionTable } from "@/components/questionnaire/question-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface QuestionData {
  id: string;
  number: number;
  section: string;
  question: string;
  aiAnswer: string;
  confidence: number;
  evidence: { source: string; snippet: string; page?: number }[];
  status: "pending" | "approved" | "rejected" | "edited";
  editedAnswer?: string;
}

// Mock data for development
const MOCK_QUESTIONS: QuestionData[] = [
  {
    id: "q1",
    number: 1,
    section: "Security Policy",
    question: "Does your organization have a formal information security policy?",
    aiAnswer:
      "Yes, our organization maintains a comprehensive Information Security Policy that is reviewed annually by the security team and approved by executive leadership. The policy covers data classification, access control, incident response, and third-party risk management. It is accessible to all employees via the company intranet and is included in the new hire onboarding process.",
    confidence: 95,
    evidence: [
      {
        source: "Security_Policies_2024.pdf",
        snippet:
          "Section 1.1: The Information Security Policy is reviewed annually by the CISO and approved by the Board of Directors.",
        page: 3,
      },
      {
        source: "SOC2_Report_Q3.docx",
        snippet:
          "The organization maintains a formal security policy that is communicated to all employees during onboarding.",
        page: 12,
      },
    ],
    status: "pending",
  },
  {
    id: "q2",
    number: 2,
    section: "Access Control",
    question:
      "How do you manage user access to systems and data?",
    aiAnswer:
      "User access is managed through our Identity and Access Management (IAM) system, which integrates with SSO via Okta. Access is provisioned based on the principle of least privilege. Role-based access control (RBAC) is implemented across all major systems. Quarterly access reviews are conducted by system owners. Offboarding procedures ensure access is revoked within 24 hours of termination.",
    confidence: 88,
    evidence: [
      {
        source: "Security_Policies_2024.pdf",
        snippet:
          "Section 3.2: Access Control Policy — All access is granted based on the principle of least privilege.",
        page: 7,
      },
    ],
    status: "approved",
  },
  {
    id: "q3",
    number: 3,
    section: "Data Encryption",
    question:
      "What encryption standards do you use for data at rest and in transit?",
    aiAnswer:
      "We use AES-256 encryption for data at rest and TLS 1.3 for data in transit. All customer data stored in our cloud infrastructure is encrypted using industry-standard encryption algorithms. Database encryption is enabled by default, and all API communications require TLS.",
    confidence: 72,
    evidence: [
      {
        source: "Data_Processing_Agreement.pdf",
        snippet:
          "Data at rest is encrypted using AES-256. Data in transit is encrypted using TLS 1.2 or higher.",
        page: 5,
      },
    ],
    status: "pending",
  },
  {
    id: "q4",
    number: 4,
    section: "Incident Response",
    question:
      "Describe your incident response process and SLAs.",
    aiAnswer:
      "Our incident response process follows the NIST framework with four phases: Preparation, Detection & Analysis, Containment & Eradication, and Post-Incident Recovery. We have defined SLAs based on severity: Critical (1 hour response), High (4 hours), Medium (24 hours), and Low (72 hours).",
    confidence: 45,
    evidence: [
      {
        source: "Incident_Response_Plan.docx",
        snippet:
          "The incident response plan defines four severity levels with corresponding response time SLAs.",
        page: 2,
      },
    ],
    status: "rejected",
  },
  {
    id: "q5",
    number: 5,
    section: "Third-Party Risk",
    question:
      "How do you assess and manage third-party vendor risk?",
    aiAnswer:
      "Our third-party risk management program includes initial due diligence assessments, annual security reviews, and continuous monitoring of vendor security posture. All vendors with access to customer data must complete a security questionnaire and demonstrate compliance with minimum security standards.",
    confidence: 82,
    evidence: [
      {
        source: "Security_Policies_2024.pdf",
        snippet:
          "Section 5.0: Third-Party Risk Management — All vendors undergo initial and annual security assessments.",
        page: 15,
      },
    ],
    status: "edited",
    editedAnswer:
      "Our third-party risk management program includes initial due diligence assessments, annual security reviews, and continuous monitoring of vendor security posture. All vendors with access to customer data must complete a SOC 2 Type II report and demonstrate compliance with our minimum security standards.",
  },
];

export default function QuestionnaireDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API call to load questions
    const timer = setTimeout(() => {
      setQuestions(MOCK_QUESTIONS);
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const handleApprove = (id: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id ? { ...q, status: "approved" as const } : q
      )
    );
  };

  const handleReject = (id: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id ? { ...q, status: "rejected" as const } : q
      )
    );
  };

  const handleEdit = (id: string, answer: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id
          ? { ...q, status: "edited" as const, editedAnswer: answer }
          : q
      )
    );
  };

  const handleRegenerate = (id: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id
          ? {
              ...q,
              status: "pending" as const,
              confidence: Math.min(100, q.confidence + 5),
            }
          : q
      )
    );
  };

  const handleBulkApprove = (ids: string[]) => {
    setQuestions((prev) =>
      prev.map((q) =>
        ids.includes(q.id) ? { ...q, status: "approved" as const } : q
      )
    );
  };

  const handleBulkReject = (ids: string[]) => {
    setQuestions((prev) =>
      prev.map((q) =>
        ids.includes(q.id) ? { ...q, status: "rejected" as const } : q
      )
    );
  };

  const stats = {
    total: questions.length,
    approved: questions.filter((q) => q.status === "approved").length,
    rejected: questions.filter((q) => q.status === "rejected").length,
    edited: questions.filter((q) => q.status === "edited").length,
    pending: questions.filter((q) => q.status === "pending").length,
  };

  const completionPct =
    stats.total > 0
      ? Math.round(
          ((stats.approved + stats.rejected + stats.edited) / stats.total) * 100
        )
      : 0;

  return (
    <div className="p-6">
      {/* Back Button */}
      <button
        onClick={() => router.push("/questionnaires")}
        className="mb-4 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to questionnaires
      </button>

      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                SOC 2 Type II Assessment
              </h1>
              <Badge
                variant={
                  stats.pending === 0
                    ? "success"
                    : stats.approved > 0
                    ? "warning"
                    : "secondary"
                }
              >
                {stats.pending === 0
                  ? "Completed"
                  : stats.approved > 0
                  ? "In Progress"
                  : "Draft"}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Security Compliance · 145 questions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" disabled={stats.pending > 0}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Progress Stats */}
        <div className="mt-4 grid grid-cols-5 gap-3">
          <StatCard
            label="Total"
            value={stats.total}
            icon={FileText}
            color="text-muted-foreground"
          />
          <StatCard
            label="Approved"
            value={stats.approved}
            icon={CheckCircle2}
            color="text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            label="Rejected"
            value={stats.rejected}
            icon={AlertCircle}
            color="text-red-600 dark:text-red-400"
          />
          <StatCard
            label="Edited"
            value={stats.edited}
            icon={FileText}
            color="text-amber-600 dark:text-amber-400"
          />
          <StatCard
            label="Pending"
            value={stats.pending}
            icon={Loader2}
            color="text-muted-foreground"
          />
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Review progress</span>
            <span className="font-medium">{completionPct}%</span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question Table */}
      <QuestionTable
        title="Questions & Answers"
        questions={questions}
        onApprove={handleApprove}
        onReject={handleReject}
        onEdit={handleEdit}
        onRegenerate={handleRegenerate}
        onBulkApprove={handleBulkApprove}
        onBulkReject={handleBulkReject}
        loading={loading}
        error={error}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4", color)} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={cn("mt-1 text-lg font-semibold", color)}>{value}</p>
    </div>
  );
}

function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}