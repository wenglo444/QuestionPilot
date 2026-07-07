import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";

// Mock lucide-react
vi.mock("lucide-react", () => ({
  FileText: () => React.createElement("svg", { "data-testid": "file-text" }),
  Check: () => React.createElement("svg", { "data-testid": "check" }),
  X: () => React.createElement("svg", { "data-testid": "x" }),
  Pencil: () => React.createElement("svg", { "data-testid": "pencil" }),
  RefreshCw: () => React.createElement("svg", { "data-testid": "refresh" }),
  Search: () => React.createElement("svg", { "data-testid": "search" }),
  Loader2: () => React.createElement("svg", { "data-testid": "loader" }),
  AlertCircle: () => React.createElement("svg", { "data-testid": "alert" }),
  CheckCheck: () => React.createElement("svg", {}),
  XCircle: () => React.createElement("svg", {}),
  ChevronDown: () => React.createElement("svg", {}),
  ChevronUp: () => React.createElement("svg", {}),
}));

vi.mock("@/lib/utils", () => ({
  cn: (...inputs: unknown[]) => inputs.filter(Boolean).join(" "),
}));

describe("QuestionTable", () => {
  it("should render empty state when no questions", async () => {
    const { QuestionTable } = await import("@/components/questionnaire/question-table");
    const { container } = render(
      React.createElement(QuestionTable, { title: "Test", questions: [] })
    );
    expect(container.textContent).toContain("No questions yet");
  });

  it("should render loading state", async () => {
    const { QuestionTable } = await import("@/components/questionnaire/question-table");
    const { container } = render(
      React.createElement(QuestionTable, { title: "Test", loading: true })
    );
    expect(container.textContent).toContain("Generating answers");
  });

  it("should render error state", async () => {
    const { QuestionTable } = await import("@/components/questionnaire/question-table");
    const { container } = render(
      React.createElement(QuestionTable, {
        title: "Test",
        error: "Something went wrong",
      })
    );
    expect(container.textContent).toContain("Something went wrong");
  });

  it("should render questions", async () => {
    const { QuestionTable } = await import("@/components/questionnaire/question-table");
    const questions = [
      {
        id: "q1",
        number: 1,
        section: "Security",
        question: "Test question?",
        aiAnswer: "Test answer",
        confidence: 95,
        evidence: [{ source: "doc.pdf", snippet: "citation text" }],
        status: "pending" as const,
      },
    ];
    const { container } = render(
      React.createElement(QuestionTable, { title: "Test", questions })
    );
    expect(container.textContent).toContain("Test question");
    expect(container.textContent).toContain("Test answer");
    expect(container.textContent).toContain("95%");
  });
});
