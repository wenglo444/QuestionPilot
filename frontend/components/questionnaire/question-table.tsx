"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Check,
  X,
  Pencil,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  FileText,
  Search,
  CheckCheck,
  XCircle,
} from "lucide-react";

type QuestionStatus = "pending" | "approved" | "rejected" | "edited";

interface Evidence {
  source: string;
  snippet: string;
  page?: number;
}

interface Question {
  id: string;
  number: number;
  section: string;
  question: string;
  aiAnswer: string;
  confidence: number;
  evidence: Evidence[];
  status: QuestionStatus;
  editedAnswer?: string;
}

interface QuestionTableProps {
  title: string;
  questions?: Question[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onEdit?: (id: string, answer: string) => void;
  onRegenerate?: (id: string) => void;
  onBulkApprove?: (ids: string[]) => void;
  onBulkReject?: (ids: string[]) => void;
  loading?: boolean;
  error?: string | null;
}

const statusConfig = {
  pending: {
    label: "Pending",
    variant: "secondary" as const,
    icon: null,
  },
  approved: {
    label: "Approved",
    variant: "success" as const,
    icon: Check,
  },
  rejected: {
    label: "Rejected",
    variant: "destructive" as const,
    icon: X,
  },
  edited: {
    label: "Edited",
    variant: "warning" as const,
    icon: Pencil,
  },
};

function ConfidenceBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950"
      : score >= 50
      ? "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950"
      : "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        color
      )}
    >
      {score}%
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <FileText className="mb-4 h-12 w-12 text-muted-foreground/40" />
      <h3 className="mb-1 text-base font-medium">No questions yet</h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        Upload a questionnaire to get started. AI-generated answers will appear
        here for review.
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Loader2 className="mb-4 h-8 w-8 animate-spin text-muted-foreground/40" />
      <h3 className="mb-1 text-base font-medium">Generating answers</h3>
      <p className="text-sm text-muted-foreground">
        AI is analyzing your knowledge base and generating responses...
      </p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AlertCircle className="mb-4 h-12 w-12 text-destructive/40" />
      <h3 className="mb-1 text-base font-medium">Something went wrong</h3>
      <p className="mb-4 max-w-sm text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function QuestionTable({
  title,
  questions = [],
  onApprove,
  onReject,
  onEdit,
  onRegenerate,
  onBulkApprove,
  onBulkReject,
  loading = false,
  error = null,
}: QuestionTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedEvidence, setExpandedEvidence] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredQuestions = questions.filter(
    (q) =>
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.section.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingQuestions = questions.filter((q) => q.status === "pending");
  const allSelected =
    selectedIds.size === pendingQuestions.length && pendingQuestions.length > 0;

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingQuestions.map((q) => q.id)));
    }
  }, [allSelected, pendingQuestions]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleEdit = (question: Question) => {
    setEditingId(question.id);
    setEditValue(question.editedAnswer || question.aiAnswer);
  };

  const handleSaveEdit = (id: string) => {
    onEdit?.(id, editValue);
    setEditingId(null);
    setEditValue("");
    toast.success("Answer saved", { description: "Your edit has been applied." });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleBulkApprove = () => {
    onBulkApprove?.(Array.from(selectedIds));
    toast.success("Answers approved", {
      description: `${selectedIds.size} answers approved.`,
    });
    setSelectedIds(new Set());
  };

  const handleBulkReject = () => {
    onBulkReject?.(Array.from(selectedIds));
    toast.error("Answers rejected", {
      description: `${selectedIds.size} answers rejected.`,
    });
    setSelectedIds(new Set());
  };

  const handleSingleApprove = (id: string, label: string) => {
    onApprove?.(id);
    toast.success("Answer approved", {
      description: `${label} approved successfully.`,
    });
  };

  const handleSingleReject = (id: string, label: string) => {
    onReject?.(id);
    toast.error("Answer rejected", {
      description: `${label} rejected.`,
    });
  };

  const handleRegenerate = (id: string, label: string) => {
    onRegenerate?.(id);
    toast.loading("Regenerating answer...", {
      description: `${label} — AI is generating a new answer.`,
      id: `regenerate-${id}`,
    });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't fire shortcuts if typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Except "/" to focus search from anywhere
        if (e.key === "/" && target !== searchRef.current) return;
        return;
      }

      if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }

      if (filteredQuestions.length === 0) return;

      // Find current focused index from the list
      const currentFocus =
        focusedIndex >= 0 ? filteredQuestions[focusedIndex] : null;

      if (!currentFocus) return;

      const qLabel = `Q${currentFocus.number}`;

      switch (e.key.toLowerCase()) {
        case "a":
          if (currentFocus.status === "pending") {
            e.preventDefault();
            handleSingleApprove(currentFocus.id, qLabel);
          }
          break;
        case "r":
          if (currentFocus.status === "pending") {
            e.preventDefault();
            handleSingleReject(currentFocus.id, qLabel);
          }
          break;
        case "e":
          if (editingId !== currentFocus.id) {
            e.preventDefault();
            handleEdit(currentFocus);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredQuestions, focusedIndex, editingId]);

  // Update focusedIndex when clicking a card
  const handleCardClick = (index: number) => {
    setFocusedIndex(index);
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (questions.length === 0) return <EmptyState />;

  const pendingCount = questions.filter((q) => q.status === "pending").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">
            {questions.length} questions ·{" "}
            {questions.filter((q) => q.status === "approved").length} approved
            {" · "}
            {pendingCount} pending
          </p>
        </div>
        {/* Keyboard shortcut hint */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px]">
            /
          </span>
          <span>search</span>
          <span className="mx-1">·</span>
          <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px]">
            A
          </span>
          <span>approve</span>
          <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px]">
            R
          </span>
          <span>reject</span>
          <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px]">
            E
          </span>
          <span>edit</span>
        </div>
      </div>

      {/* Search + Bulk Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            placeholder="Search questions... (press / to focus)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} selected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkApprove}
              className="text-emerald-600"
            >
              <CheckCheck className="mr-1.5 h-4 w-4" />
              Approve all
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkReject}
              className="text-red-600"
            >
              <XCircle className="mr-1.5 h-4 w-4" />
              Reject all
            </Button>
          </div>
        )}
      </div>

      {/* Question Cards */}
      <div className="space-y-2">
        {filteredQuestions.map((question, index) => {
          const status = statusConfig[question.status];
          const isEditing = editingId === question.id;
          const isExpanded = expandedEvidence === question.id;
          const isSelected = selectedIds.has(question.id);
          const isFocused = focusedIndex === index;

          return (
            <Card
              key={question.id}
              className={cn(
                "transition-all",
                isSelected && "ring-1 ring-primary",
                isFocused && "ring-1 ring-ring"
              )}
              onClick={() => handleCardClick(index)}
            >
              <CardContent className="p-4">
                {/* Question Header */}
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {question.status === "pending" && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(question.id)}
                        className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          Q{question.number}
                        </span>
                        <Badge variant="secondary" className="text-[10px]">
                          {question.section}
                        </Badge>
                        {isFocused && (
                          <span className="text-[10px] text-muted-foreground/60 font-mono">
                            focused
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm font-medium leading-snug">
                        {question.question}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ConfidenceBadge score={question.confidence} />
                    <Badge variant={status.variant}>
                      {status.icon && <status.icon className="mr-1 h-3 w-3" />}
                      {status.label}
                    </Badge>
                  </div>
                </div>

                {/* AI Answer */}
                <div className="mb-3">
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="min-h-[100px] w-full rounded-md border border-input bg-background p-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        placeholder="Edit the answer..."
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(question.id)}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="rounded-md bg-secondary/50 p-3 text-sm leading-relaxed">
                      {question.editedAnswer || question.aiAnswer}
                    </p>
                  )}
                </div>

                {/* Bottom Row: Evidence + Actions */}
                <div className="flex items-center justify-between">
                  <div>
                    {question.evidence.length > 0 && (
                      <button
                        onClick={() =>
                          setExpandedEvidence(
                            isExpanded ? null : question.id
                          )
                        }
                        className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>
                          {question.evidence.length} source
                          {question.evidence.length > 1 ? "s" : ""}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {question.status !== "approved" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleSingleApprove(question.id, `Q${question.number}`)
                        }
                        className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        title="Approve (A)"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    {question.status !== "rejected" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleSingleReject(question.id, `Q${question.number}`)
                        }
                        className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Reject (R)"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    {!isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(question)}
                        className="h-8"
                        title="Edit (E)"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleRegenerate(question.id, `Q${question.number}`)
                      }
                      className="h-8"
                      title="Regenerate"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Evidence Panel */}
                {isExpanded && (
                  <div className="mt-3 space-y-2 border-t border-border pt-3">
                    {question.evidence.map((ev, i) => (
                      <div
                        key={i}
                        className="rounded-md bg-secondary/30 p-3 text-xs"
                      >
                        <div className="mb-1 flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {ev.source}
                          </span>
                          {ev.page && (
                            <span className="text-muted-foreground">
                              p. {ev.page}
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground">
                          &ldquo;{ev.snippet}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredQuestions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No questions match your search.
          </p>
        </div>
      )}
    </div>
  );
}