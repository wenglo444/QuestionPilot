"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  BookOpen,
  Settings,
  LogOut,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

const sidebarLinks = [
  {
    group: "Main",
    links: [
      {
        label: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
      },
      {
        label: "Projects",
        href: "/projects",
        icon: FolderKanban,
      },
      {
        label: "Questionnaires",
        href: "/questionnaires",
        icon: FileText,
      },
      {
        label: "Knowledge Base",
        href: "/knowledge-base",
        icon: BookOpen,
      },
    ],
  },
  {
    group: "Settings",
    links: [
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
      },
    ],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const user = session?.user;
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "QP";

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col border-r border-border bg-sidebar">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
            <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold">QuestionPilot</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-4 overflow-y-auto p-3">
          {sidebarLinks.map((group) => (
            <div key={group.group}>
              <p className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {group.group}
              </p>
              <div className="space-y-0.5">
                {group.links.map((link) => {
                  const isActive =
                    link.href === "/"
                      ? pathname === "/" || pathname === "/dashboard"
                      : pathname.startsWith(link.href);

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                        isActive
                          ? "bg-sidebar-active text-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-sidebar-muted hover:text-foreground"
                      )}
                    >
                      <link.icon className="h-4 w-4 flex-shrink-0" />
                      <span>{link.label}</span>
                      {isActive && (
                        <ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Menu */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5">
            <Avatar className="h-7 w-7">
              <AvatarImage src={user?.image || ""} />
              <AvatarFallback className="text-[11px]">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium leading-tight">
                {user?.name || "User"}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {user?.email || ""}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-muted hover:text-foreground"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-14 items-center justify-between border-b border-border px-6">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              {pathname === "/" && "Dashboard"}
              {pathname.startsWith("/projects") && "Projects"}
              {pathname.startsWith("/questionnaires") && "Questionnaires"}
              {pathname.startsWith("/knowledge-base") && "Knowledge Base"}
              {pathname.startsWith("/settings") && "Settings"}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {user?.email}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
