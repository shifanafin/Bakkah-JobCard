"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut, useSession } from "@/lib/auth-client";
import {
  LayoutDashboard,
  ClipboardList,
  Settings,
  LogOut,
  ChevronRight,
  X,
  Briefcase,
  Users,
  Megaphone,
  Wrench,
  Clock,
  MessageSquare,
  Globe,
  UserRound,
  Receipt,
  Bell,
  Tag,
  Car,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useShell } from "@/components/layout/WorkshopShell";
import AttendanceWidget from "@/components/AttendanceWidget";
import { createClient } from "@/lib/supabase/client";

const NAV = {
  workshop: 'Workshop', admin: 'Admin',
  dashboard: 'Dashboard', myJobs: 'My Jobs', jobCards: 'Job Cards',
  newJobCard: 'New Job Card', customers: 'Customers',
  settings: 'Settings', signOut: 'Sign Out', employees: 'Employees',
  attendance: 'Attendance', feedback: 'Feedback',
  announcements: 'Announcements', analytics: 'Analytics', website: 'Website CMS',
  services: 'Services',
}

type NavItem = {
  href: string;
  icon: React.ElementType;
  label: string;
  highlight?: boolean;
};

export default function Sidebar() {
  const path = usePathname();
  const { sidebarOpen, setSidebarOpen } = useShell();

  return (
    <>
      {/* Desktop sidebar: always visible on lg+ */}
      <aside className="hidden lg:flex h-full w-[220px] shrink-0 flex-col border-r border-gray-200 bg-white dark:border-white/[0.06] dark:bg-surface-950 ltr:border-r rtl:border-l rtl:order-last">
        <SidebarContent path={path} onClose={() => {}} showClose={false} />
      </aside>

      {/* Mobile sidebar: slide-in drawer — slides from left in LTR, from right in RTL */}
      <aside
        className={cn(
          "absolute inset-y-0 z-30 flex w-[220px] flex-col border-gray-200 bg-white transition-transform duration-200 dark:border-white/[0.06] dark:bg-surface-950 lg:hidden",
          "ltr:left-0 ltr:border-r rtl:right-0 rtl:border-l",
          sidebarOpen
            ? "translate-x-0"
            : "ltr:-translate-x-full rtl:translate-x-full",
        )}
      >
        <SidebarContent
          path={path}
          onClose={() => setSidebarOpen(false)}
          showClose
        />
      </aside>
    </>
  );
}

function useChatNotificationCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const sb = createClient();

    async function fetch() {
      const { count: n } = await sb
        .from("chat_notifications")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false);
      setCount(n ?? 0);
    }

    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, []);

  return count;
}

function SidebarContent({
  path,
  onClose,
  showClose,
}: {
  path: string;
  onClose: () => void;
  showClose: boolean;
}) {
  const { data: session } = useSession();
  const chatCount = useChatNotificationCount();
  const nav = NAV;
  const role =
    (session?.user as { role?: string } | undefined)?.role ?? "receptionist";

  const workshopNav: NavItem[] = [];
  const adminNav: NavItem[] = [];

  if (role === "technician") {
    workshopNav.push(
      { href: "/workshop/dashboard", icon: LayoutDashboard, label: nav.dashboard },
      { href: "/workshop/my-jobs", icon: Briefcase, label: nav.myJobs },
      { href: "/workshop/attendance", icon: Clock, label: "Attendance" },
      { href: "/workshop/my/leave", icon: Tag, label: "Leave Requests" },
      { href: "/workshop/my/suggestions", icon: MessageSquare, label: "Suggestions" },
      { href: "/workshop/my/complaints", icon: Megaphone, label: "Complaints" },
    );
  } else if (role === "receptionist") {
    workshopNav.push(
      {
        href: "/workshop/dashboard",
        icon: LayoutDashboard,
        label: nav.dashboard,
      },
      { href: "/workshop/job-cards", icon: ClipboardList, label: nav.jobCards },
    );
  } else if (role === "supervisor" || role === "admin" || role === "manager") {
    workshopNav.push(
      {
        href: "/workshop/dashboard",
        icon: LayoutDashboard,
        label: nav.dashboard,
      },
      { href: "/workshop/job-cards", icon: ClipboardList, label: nav.jobCards },
      { href: "/workshop/customers", icon: UserRound, label: nav.customers },
      { href: "/workshop/vehicles", icon: Car, label: 'Vehicles' },
      { href: "/workshop/services", icon: Wrench, label: 'Services' },
      { href: "/workshop/admin/hr", icon: Users, label: "People & HR" },
      { href: "/workshop/transactions", icon: Receipt, label: 'Transactions' },
    );
  } else if (role === "accountant") {
    workshopNav.push(
      {
        href: "/workshop/dashboard",
        icon: LayoutDashboard,
        label: nav.dashboard,
      },
      { href: "/workshop/job-cards", icon: ClipboardList, label: nav.jobCards },
      { href: "/workshop/customers", icon: UserRound, label: nav.customers },
      { href: "/workshop/vehicles", icon: Car, label: 'Vehicles' },
      { href: "/workshop/transactions", icon: Receipt, label: 'Transactions' },
    );
  }

  if (role === "admin") {
    adminNav.push(
      {
        href: "/workshop/admin/announcements",
        icon: Megaphone,
        label: nav.announcements,
      },
      { href: "/workshop/admin/website", icon: Globe, label: nav.website },
      { href: "/workshop/admin/promotions", icon: Tag, label: 'Promotions' },
    );
  }

  return (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-5 dark:border-white/[0.06]">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Bakkah Logo" className="h-9 w-9 rounded-full ring-1 ring-brand/30" />
          <div>
            <p className="font-display text-lg leading-none tracking-wide text-gray-900 dark:text-white">
              Bakkah
            </p>
            <p className="text-[10px] text-gray-400 leading-tight dark:text-white/30">
              Workshop Pro
            </p>
          </div>
        </div>
        {showClose && (
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition dark:text-white/30 dark:hover:bg-white/[0.06] dark:hover:text-white/60"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-white/25">
          {nav.workshop}
        </p>
        {workshopNav.map(({ href, icon: Icon, label, highlight }) => {
          const isActive =
            path === href ||
            (href !== "/workshop/dashboard" &&
              path.startsWith(href) &&
              href !== "/workshop/job-cards/new");
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                highlight && !isActive
                  ? "border border-brand/20 bg-brand/10 text-brand hover:bg-brand/15"
                  : isActive
                    ? "bg-gray-100 text-gray-900 dark:bg-white/[0.08] dark:text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-white/50 dark:hover:bg-white/[0.04] dark:hover:text-white/80",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {isActive && (
                <ChevronRight className="h-3 w-3 opacity-40 rtl:rotate-180" />
              )}
            </Link>
          );
        })}

        {/* Admin section */}
        {adminNav.length > 0 && (
          <>
            <div className="my-2 px-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-white/25">
                {nav.admin}
              </p>
            </div>
            {adminNav.map(({ href, icon: Icon, label }) => {
              const isActive = path === href || path.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-gray-100 text-gray-900 dark:bg-white/[0.08] dark:text-white"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-white/50 dark:hover:bg-white/[0.04] dark:hover:text-white/80",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{label}</span>
                  {isActive && (
                    <ChevronRight className="h-3 w-3 opacity-40 rtl:rotate-180" />
                  )}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Attendance widget — visible to technicians, supervisors, receptionists */}
      <div className="border-t border-gray-200 dark:border-white/[0.06] pt-3">
        <AttendanceWidget />
      </div>

      {/* Bottom */}
      <div className="p-3 space-y-0.5">
        {/* Website chat requests notification */}
        <Link
          href="/workshop/enquiries"
          onClick={onClose}
          className="relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-500 hover:bg-amber-50 hover:text-amber-600 transition-all dark:text-white/40 dark:hover:bg-amber-500/10 dark:hover:text-amber-400"
        >
          <Bell className="h-4 w-4" />
          <span className="flex-1">Website Enquiries</span>
          {chatCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#C9A227] px-1.5 text-[10px] font-bold text-black animate-pulse">
              {chatCount > 9 ? "9+" : chatCount}
            </span>
          )}
        </Link>
        <Link
          href="/workshop/settings"
          onClick={onClose}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all dark:text-white/40 dark:hover:bg-white/[0.04] dark:hover:text-white/70"
        >
          <Settings className="h-4 w-4" />
          {nav.settings}
        </Link>
        <button
          onClick={() =>
            signOut({
              fetchOptions: {
                onSuccess: () => {
                  window.location.href = "/";
                },
              },
            })
          }
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all dark:text-white/40 dark:hover:bg-red-500/10 dark:hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          {nav.signOut}
        </button>
      </div>
    </>
  );
}
