import React from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  MessageSquare,
  Phone,
  PhoneCall,
  Search,
  Voicemail,
  Activity,
  Bell,
  ShieldCheck,
  Webhook,
  Workflow,
  ListOrdered,
  Users,
  Users2,
  Settings,
  Video,
  MessageCircle,
  HeartPulse,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "SMS Center", href: "/sms", icon: MessageSquare },
  { name: "Calls", href: "/calls", icon: PhoneCall },
  { name: "Phone Numbers", href: "/phone-numbers", icon: Phone },
  { name: "Number Lookup", href: "/lookup", icon: Search },
  { name: "Voicemails", href: "/voicemails", icon: Voicemail },
  { name: "Usage & Billing", href: "/usage", icon: Activity },
  { name: "Alerts", href: "/alerts", icon: Bell },
  { name: "Verify", href: "/verify", icon: ShieldCheck },
  { name: "Messaging Services", href: "/messaging-services", icon: Webhook },
  { name: "Studio", href: "/studio", icon: Workflow },
  { name: "Queues", href: "/queues", icon: ListOrdered },
  { name: "Conferences", href: "/conferences", icon: Users2 },
  { name: "Contacts", href: "/contacts", icon: Users },
  { name: "Video Rooms", href: "/video", icon: Video },
  { name: "Conversations", href: "/conversations", icon: MessageCircle },
  { name: "Telehealth", href: "/telehealth", icon: HeartPulse },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground dark">
      <div className="w-64 flex-shrink-0 border-r bg-sidebar flex flex-col">
        <div className="h-16 flex items-center px-4 border-b">
          <div className="flex items-center gap-2 font-bold text-lg text-sidebar-foreground">
            <div className="size-8 rounded bg-primary flex items-center justify-center text-primary-foreground">
              T
            </div>
            Twilio Console
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="size-4" />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t">
          <div className="text-xs text-muted-foreground">Version 3.0.0</div>
        </div>
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b flex items-center px-6 bg-card">
          <div className="flex-1"></div>
          <div className="flex items-center gap-4">
            <div className="size-8 rounded-full bg-accent flex items-center justify-center text-sm font-medium">
              R
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6 bg-background dark">
          {children}
        </main>
      </div>
    </div>
  );
}
