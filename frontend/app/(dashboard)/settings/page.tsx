"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  CreditCard,
  Users,
} from "lucide-react";

const settingsSections = [
  {
    icon: User,
    title: "Profile",
    description: "Manage your name, email, and avatar",
    badge: null,
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "Configure email and in-app notifications",
    badge: "3",
  },
  {
    icon: Users,
    title: "Team",
    description: "Invite and manage team members",
    badge: null,
  },
  {
    icon: Shield,
    title: "Security",
    description: "Password, SSO, and session management",
    badge: null,
  },
  {
    icon: Palette,
    title: "Appearance",
    description: "Theme, density, and display preferences",
    badge: null,
  },
  {
    icon: CreditCard,
    title: "Billing",
    description: "Subscription plan, invoices, and payment methods",
    badge: "Pro",
  },
];

export default function SettingsPage() {
  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account and workspace settings
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Settings Navigation */}
        <div className="space-y-1 lg:col-span-1">
          {settingsSections.map((section) => (
            <button
              key={section.title}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-secondary"
            >
              <section.icon className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">{section.title}</p>
                <p className="text-xs text-muted-foreground">
                  {section.description}
                </p>
              </div>
              {section.badge && (
                <Badge variant="secondary">{section.badge}</Badge>
              )}
            </button>
          ))}
        </div>

        {/* Profile Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                JD
              </div>
              <div>
                <Button variant="outline" size="sm">
                  Change Avatar
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input defaultValue="Jane Doe" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input defaultValue="jane@company.com" type="email" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Company</label>
                <Input defaultValue="Acme Corp" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Job Title</label>
                <Input defaultValue="Security Engineer" />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline">Cancel</Button>
              <Button>Save Changes</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
