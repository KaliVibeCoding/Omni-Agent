import React, { useState } from "react";
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
  ChevronRight,
  Zap,
  LogOut,
  ChevronDown,
  CreditCard,
  Mail,
  Brain,
  Shield,
  Plug,
  Home,
  Umbrella,
  Scale,
  Car,
  Wrench,
  Dumbbell,
  UtensilsCrossed,
  Building2,
  Heart,
  GraduationCap,
  Briefcase,
  Sparkles,
  KeyRound,
  ShoppingCart,
  LineChart,
  Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useClerk, useUser } from "@clerk/react";

const NAV_SECTIONS = [
  {
    label: "COMMUNICATIONS",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "SMS Center", href: "/sms", icon: MessageSquare },
      { name: "Calls", href: "/calls", icon: PhoneCall },
      { name: "Phone Numbers", href: "/phone-numbers", icon: Phone },
    ],
  },
  {
    label: "CAMPAIGNS",
    items: [
      { name: "Email Campaigns", href: "/email-campaigns", icon: Mail },
    ],
  },
  {
    label: "TOOLS",
    items: [
      { name: "Number Lookup", href: "/lookup", icon: Search },
      { name: "Voicemails", href: "/voicemails", icon: Voicemail },
      { name: "Conferences", href: "/conferences", icon: Users2 },
      { name: "Contacts", href: "/contacts", icon: Users },
    ],
  },
  {
    label: "PLATFORM",
    items: [
      { name: "Video Rooms", href: "/video", icon: Video },
      { name: "Conversations", href: "/conversations", icon: MessageCircle },
      { name: "Telehealth", href: "/telehealth", icon: HeartPulse },
      { name: "AGI Framework", href: "/agi-framework", icon: Brain },
      { name: "Integrations", href: "/integrations", icon: Plug },
    ],
  },
  {
    label: "INDUSTRY HUBS",
    items: [
      { name: "Credit Repair", href: "/niche/credit-repair", icon: CreditCard },
      { name: "Real Estate", href: "/niche/real-estate", icon: Home },
      { name: "Insurance", href: "/niche/insurance", icon: Umbrella },
      { name: "Dental", href: "/niche/dental", icon: Stethoscope },
      { name: "Legal", href: "/niche/legal", icon: Scale },
      { name: "Auto Dealerships", href: "/niche/auto", icon: Car },
      { name: "Home Services", href: "/niche/home-services", icon: Wrench },
      { name: "Fitness / Gym", href: "/niche/fitness", icon: Dumbbell },
      { name: "Restaurant", href: "/niche/restaurant", icon: UtensilsCrossed },
      { name: "Mortgage", href: "/niche/mortgage", icon: Building2 },
      { name: "Chiropractic / PT", href: "/niche/chiropractic", icon: HeartPulse },
      { name: "Veterinary", href: "/niche/veterinary", icon: Heart },
      { name: "Education", href: "/niche/education", icon: GraduationCap },
      { name: "Nonprofit", href: "/niche/nonprofit", icon: Heart },
      { name: "Staffing", href: "/niche/staffing", icon: Briefcase },
      { name: "Med Spa", href: "/niche/med-spa", icon: Sparkles },
      { name: "Property Mgmt", href: "/niche/property-management", icon: KeyRound },
      { name: "E-Commerce", href: "/niche/ecommerce", icon: ShoppingCart },
      { name: "Financial Advisor", href: "/niche/financial-advisor", icon: LineChart },
    ],
  },
  {
    label: "SERVICES",
    items: [
      { name: "Messaging Services", href: "/messaging-services", icon: Webhook },
      { name: "Studio Flows", href: "/studio", icon: Workflow },
      { name: "Call Queues", href: "/queues", icon: ListOrdered },
      { name: "Verify / 2FA", href: "/verify", icon: ShieldCheck },
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      { name: "Billing", href: "/billing", icon: CreditCard },
      { name: "Usage & Stats", href: "/usage", icon: Activity },
      { name: "Alerts", href: "/alerts", icon: Bell },
      { name: "Settings", href: "/settings", icon: Settings },
      { name: "Admin", href: "/admin", icon: Shield },
    ],
  },
];

function UserMenu() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();

  const initials = user
    ? (user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? user.emailAddresses?.[0]?.emailAddress?.[0] ?? "?")
    : "?";

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName ?? ""}`.trim()
    : user?.emailAddresses?.[0]?.emailAddress ?? "User";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 w-full px-2 py-2 rounded-md hover:bg-sidebar-accent transition-colors"
      >
        <div
          className="size-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 uppercase"
          style={{ background: "hsl(348 83% 47%)" }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-xs font-semibold truncate text-sidebar-foreground">{displayName}</p>
          <p className="text-[10px] text-muted-foreground truncate">
            {user?.emailAddresses?.[0]?.emailAddress ?? ""}
          </p>
        </div>
        <ChevronDown className={cn("size-3 text-muted-foreground transition-transform flex-shrink-0", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-popover border border-border rounded-lg shadow-xl overflow-hidden z-50">
          <Link href="/billing">
            <div
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <CreditCard className="size-3.5" />
              Billing & Plan
            </div>
          </Link>
          <button
            onClick={() => {
              setOpen(false);
              signOut(() => setLocation("/"));
            }}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <LogOut className="size-3.5" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const isActive = (href: string) =>
    href === "/dashboard" ? location === "/dashboard" || location === "/" : location.startsWith(href);

  const currentPage = NAV_SECTIONS.flatMap(s => s.items).find(i => isActive(i.href))?.name ?? "Dashboard";

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground dark">
      {/* Sidebar */}
      <div className="w-60 flex-shrink-0 border-r border-border flex flex-col bg-sidebar">
        {/* Brand header */}
        <div className="h-14 flex items-center px-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0">
              <Zap className="size-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-sidebar-foreground leading-tight">RJ Business</div>
              <div className="text-[10px] font-semibold tracking-widest" style={{ color: "hsl(348 83% 55%)" }}>
                CONSOLE
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-5">
            {NAV_SECTIONS.map((section) => (
              <div key={section.label}>
                <p className="text-[10px] font-semibold tracking-widest text-muted-foreground px-2 mb-1.5">
                  {section.label}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link key={item.href} href={item.href}>
                        <div
                          className={cn(
                            "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-all cursor-pointer group relative",
                            active
                              ? "bg-primary/10 text-primary"
                              : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                          )}
                        >
                          {active && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-primary" />
                          )}
                          <item.icon
                            className={cn(
                              "size-4 flex-shrink-0 transition-colors",
                              active ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-foreground"
                            )}
                          />
                          <span className="truncate">{item.name}</span>
                          {active && (
                            <ChevronRight className="size-3 ml-auto text-primary opacity-60" />
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* User footer */}
        <div className="p-3 border-t border-border flex-shrink-0 space-y-2">
          <UserMenu />
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] text-muted-foreground font-mono">v3.1.0</span>
            <div className="flex items-center gap-1">
              <div className="size-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-muted-foreground">Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 border-b border-border flex items-center px-6 flex-shrink-0 bg-background">
          <div className="flex-1 flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{currentPage}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-muted-foreground hidden sm:block">RJ Business Solutions</div>
            <div
              className="size-8 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground"
              style={{ background: "hsl(348 83% 47%)" }}
            >
              RJ
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
