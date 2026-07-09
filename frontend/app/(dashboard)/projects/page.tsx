"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, FolderKanban, MoreHorizontal, FolderOpen } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

const defaultProjects = [
  {
    name: "Security Compliance",
    description: "SOC 2, ISO 27001, and related security assessments",
    count: 5,
    status: "active",
  },
  {
    name: "Acme Corp Onboarding",
    description: "Vendor assessment for Acme Corporation",
    count: 3,
    status: "active",
  },
  {
    name: "Data Privacy",
    description: "GDPR and CCPA compliance questionnaires",
    count: 2,
    status: "active",
  },
  {
    name: "Infrastructure Review",
    description: "Cloud security and infrastructure assessments",
    count: 4,
    status: "active",
  },
  {
    name: "Q4 2024 Audits",
    description: "Quarterly compliance review cycle",
    count: 6,
    status: "active",
  },
  {
    name: "Legacy Assessments",
    description: "Completed assessments from previous quarters",
    count: 8,
    status: "archived",
  },
];

export default function ProjectsPage() {
  const [projects] = useState(defaultProjects);
  const [showEmpty, setShowEmpty] = useState(false);

  // Toggle for demo: click to toggle between empty and populated state
  const displayedProjects = showEmpty ? [] : projects;

  return (
    <div className="p-4 md:p-6">
      {/* Page Header */}
      <div className="mb-6 md:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your RFP and compliance projects
          </p>
        </div>
        <Button size="sm" className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {displayedProjects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No projects yet"
          description="Create your first project to start automating RFP responses and compliance questionnaires."
          actionLabel="Create Project"
          onAction={() => {}}
        />
      ) : (
        /* Projects Grid */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayedProjects.map((project) => (
            <Card key={project.name} className="transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FolderKanban className="h-5 w-5 text-primary" />
                  </div>
                  <button className="rounded-md p-1 text-muted-foreground hover:bg-secondary">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
                <CardTitle className="mt-3 text-base">{project.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {project.description}
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Questionnaires:</span>
                    <span className="font-medium">{project.count}</span>
                  </div>
                  <Badge variant={project.status === "active" ? "success" : "secondary"}>
                    {project.status === "active" ? "Active" : "Archived"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}