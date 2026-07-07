"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  FolderKanban,
  MoreHorizontal,
  FileText,
  BookOpen,
  Clock,
  ArrowRight,
  Search,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string;
  questionnaireCount: number;
  documentCount: number;
  lastActivity: string;
  status: "active" | "archived";
}

const initialProjects: Project[] = [
  { id: "1", name: "Security Compliance", description: "SOC 2, ISO 27001, and related security assessments", questionnaireCount: 5, documentCount: 12, lastActivity: "2 hours ago", status: "active" },
  { id: "2", name: "Acme Corp Onboarding", description: "Vendor assessment for Acme Corporation", questionnaireCount: 3, documentCount: 8, lastActivity: "1 day ago", status: "active" },
  { id: "3", name: "Data Privacy", description: "GDPR and CCPA compliance questionnaires", questionnaireCount: 2, documentCount: 5, lastActivity: "3 days ago", status: "active" },
  { id: "4", name: "Infrastructure Review", description: "Cloud security and infrastructure assessments", questionnaireCount: 4, documentCount: 9, lastActivity: "5 days ago", status: "active" },
  { id: "5", name: "Q4 2024 Audits", description: "Quarterly compliance review cycle", questionnaireCount: 6, documentCount: 15, lastActivity: "1 week ago", status: "active" },
  { id: "6", name: "Legacy Assessments", description: "Completed assessments from previous quarters", questionnaireCount: 8, documentCount: 3, lastActivity: "1 month ago", status: "archived" },
];

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [showCreate, setShowCreate] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newProject, setNewProject] = useState({ name: "", description: "" });

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeProjects = filteredProjects.filter((p) => p.status === "active");
  const archivedProjects = filteredProjects.filter((p) => p.status === "archived");

  const handleCreateProject = () => {
    const project: Project = {
      id: `${Date.now()}`,
      name: newProject.name,
      description: newProject.description,
      questionnaireCount: 0,
      documentCount: 0,
      lastActivity: "Just now",
      status: "active",
    };
    setProjects([project, ...projects]);
    setNewProject({ name: "", description: "" });
    setShowCreate(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your RFP and compliance projects
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Active Projects */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Active Projects ({activeProjects.length})
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeProjects.map((project) => (
            <ProjectCard key={project.id} project={project} onClick={() => router.push(`/projects/${project.id}`)} />
          ))}
        </div>
      </div>

      {/* Archived Projects */}
      {archivedProjects.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            Archived ({archivedProjects.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {archivedProjects.map((project) => (
              <ProjectCard key={project.id} project={project} onClick={() => router.push(`/projects/${project.id}`)} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FolderKanban className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="mb-1 text-base font-medium">No projects found</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            {searchQuery ? "Try a different search term" : "Create your first project to get started"}
          </p>
          {!searchQuery && (
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          )}
        </div>
      )}

      {/* Create Project Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>
              Create a new project to organize your questionnaires and documents.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Project Name</label>
              <Input
                placeholder="e.g., Security Compliance"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="Brief description of the project"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreateProject} disabled={!newProject.name}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-left">
      <Card className="transition-all hover:shadow-md h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FolderKanban className="h-5 w-5 text-primary" />
            </div>
            <Badge variant={project.status === "active" ? "success" : "secondary"}>
              {project.status === "active" ? "Active" : "Archived"}
            </Badge>
          </div>
          <CardTitle className="mt-3 text-base">{project.name}</CardTitle>
          <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
        </CardHeader>
        <CardContent>
          <Separator className="mb-3" />
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">{project.questionnaireCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">{project.documentCount}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {project.lastActivity}
            </div>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}