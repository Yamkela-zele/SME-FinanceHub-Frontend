import { useApi } from "../useApi"
import { useEffect, useRef, useState } from "react"
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router"
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  Settings,
  X,
} from "lucide-react"
import { Brand } from "./Brand"
import { api } from "../api"
import {
  navByRole,
  roleHome,
  roleMeta,
  useAuth,
  type Role,
} from "../auth/auth"

const titles: Record<string, [string, string]> = {
  dashboard: ["Financial overview", "Financial overview"],
  transactions: ["Financial records", "Transactions"],
  income: ["Money movement", "Income & expenses"],
  invoices: ["Get paid on time", "Invoices"],
  "cash-flow": ["Plan ahead", "Cash flow forecast"],
  customers: ["Business relationships", "Customers"],
  reports: ["Clear, funding-ready records", "Financial reports"],
  "funding-readiness": ["Prepare with confidence", "Funding readiness"],
  "ai-assistant": ["Understand your numbers", "Financial insights"],
  settings: ["Your workspace", "Settings"],
  clients: ["Client portfolio", "Clients"],
  "review-queue": ["Needs your sign-off", "Review queue"],
  applications: ["Funding pipeline", "Applications"],
  portfolio: ["Funded businesses", "Portfolio"],
  users: ["Access control", "Users"],
  businesses: ["Registered SMMEs", "Businesses"],
  "business-verifications": ["Verification review", "Business verifications"],
  "audit-log": ["Accountability", "Audit log"],
  activity: ["Platform health", "Activity"],
  "accountant-applications": ["Account access", "Accountant applications"],
  "funding-partners": ["Partner onboarding", "Funding partners"],
  "funding-sharing": ["Privacy and access", "Sharing permissions"],
  team: ["Your workspace", "Team management"],
}

type Notice = { id: string; title: string; meta: string; to: string; urgent: boolean; readAt: string | null }

const dashboardHeadings: Record<Role, string> = {
  owner: "Financial overview",
  accountant: "Practice overview",
  funder: "Funding overview",
  admin: "Platform overview",
}

export function AppShell({ children }: { children?: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const segment = useLocation().pathname.split("/").pop() || "dashboard"
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const { data: noticeData } = useApi<{ data: Notice[] }>("/notifications")
  const notices = noticeData?.data ?? []
  const unreadCount = notices.filter((notice) => !notice.readAt).length
  const [search, setSearch] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-popover]")) {
        setNotificationsOpen(false)
        setMenuOpen(false)
      }
    }
    const shortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    document.addEventListener("mousedown", close)
    window.addEventListener("keydown", shortcut)
    return () => {
      document.removeEventListener("mousedown", close)
      window.removeEventListener("keydown", shortcut)
    }
  }, [])
  if (!user) return null
  const navigation = navByRole[user.role]
  const runSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const term = search.trim().toLowerCase()
    if (!term) return
    const hit = navigation.find(([label]) => label.toLowerCase().includes(term))
    if (hit) navigate(hit[1])
    else if (navigation.some(([, to]) => to === "/app/transactions"))
      navigate(`/app/transactions?q=${encodeURIComponent(search.trim())}`)
    else navigate(`${roleHome[user.role]}`)
    setSearch("")
    searchRef.current?.blur()
  }
  const base = titles[segment] ?? titles.dashboard
  const heading: [string, string] =
    segment === "dashboard" || segment in roleHome
      ? [user.greeting, dashboardHeadings[user.role]]
      : base
  return (
    <div className="min-h-screen min-w-0 bg-canvas text-ink">
      {mobileOpen && (
        <button
          className="fixed inset-0 z-40 bg-ink/45 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation overlay"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-sidebar px-4 py-6 text-white transition-transform lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-2">
          <Brand light />
          <button
            className="rounded-lg p-2 text-white/70 hover:bg-white/10 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.06] p-3">
          <button
            onClick={() => {
              setMobileOpen(false)
              navigate("/app/settings")
            }}
            className="flex w-full items-center gap-3 text-left"
          >
            <span className="grid size-9 place-items-center rounded-lg bg-mint text-sm font-bold text-sidebar">
              {user.orgInitials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">
                {user.organisation}
              </span>
              <span className="block text-xs text-white/55">
                {roleMeta[user.role].label} workspace
              </span>
            </span>
            <ChevronDown className="size-4 text-white/50" />
          </button>
        </div>
        <nav
          className="mt-6 min-h-0 flex-1 space-y-1 overflow-y-auto"
          aria-label="Application navigation"
        >
          {navigation.map(([label, to, Icon]) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white text-sidebar shadow-sm"
                    : "text-white/65 hover:bg-white/[0.08] hover:text-white"
                }`
              }
            >
              <Icon className="size-[18px]" strokeWidth={1.8} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 pt-4">
          <NavLink
            to="/app/settings"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/65 hover:bg-white/[0.08] hover:text-white"
          >
            <Settings className="size-[18px]" /> Settings
          </NavLink>
          <p className="mt-3 rounded-xl bg-white/[0.06] p-3 text-xs text-white/55">
            {roleMeta[user.role].label} workspace
          </p>
        </div>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-20 min-w-0 items-center justify-between gap-2 border-b border-line bg-white/90 px-3 backdrop-blur sm:px-5 lg:px-8">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              className="rounded-xl border border-line p-2.5 text-muted lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="size-5" />
            </button>
            <div className="min-w-0">
              <p className="hidden truncate text-xs font-semibold uppercase tracking-[0.14em] text-brand-blue sm:block">
                {heading[0]}
              </p>
              <h1 className="max-w-[42vw] truncate text-lg font-bold tracking-tight text-ink sm:mt-0.5 sm:max-w-none sm:text-xl md:text-2xl">
                {heading[1]}
              </h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <form
              onSubmit={runSearch}
              className="hidden items-center gap-2 rounded-xl border border-line bg-canvas px-3 py-2.5 text-muted md:flex"
            >
              <Search className="size-4" />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-36 bg-transparent text-sm outline-none placeholder:text-slate-400"
                placeholder="Search records"
              />
              <kbd className="rounded border border-line bg-white px-1.5 py-0.5 text-[10px]">
                ⌘K
              </kbd>
            </form>
            <div className="relative" data-popover>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative rounded-xl border border-line bg-white p-2.5 text-muted hover:bg-canvas"
                aria-label="Notifications"
              >
                <Bell className="size-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-2 top-2 size-2 rounded-full bg-danger ring-2 ring-white" />
                )}
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-1.5rem))] rounded-2xl border border-line bg-white p-3 shadow-xl">
                  <div className="flex items-center justify-between px-2 py-1">
                    <p className="text-sm font-bold">Notifications</p>
                  </div>
                  {notices.length === 0 && <p className="px-2 py-4 text-sm text-muted">You’re all caught up.</p>}
                  {notices.map(({ id, title, meta, to, urgent, readAt }) => (
                    <Link
                      key={id}
                      to={to}
                      onClick={() => {
                        setNotificationsOpen(false)
                        if (!readAt) {
                          void api(`/notifications/${id}/read`, { method: "POST" }).catch((error) => {
                            console.error("Could not mark notification as read", error)
                          })
                        }
                      }}
                      className={`mt-1 block rounded-xl p-3 text-sm ${
                        urgent ? "bg-danger-soft" : "hover:bg-canvas"
                      }`}
                    >
                      <span className="font-semibold text-ink">{title}</span>
                      <span className="mt-1 block text-xs text-muted">
                        {meta}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="relative" data-popover>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="ml-1 flex items-center gap-2 rounded-xl p-1.5 hover:bg-canvas"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span className="grid size-9 place-items-center rounded-xl bg-brand-blue text-sm font-bold text-white">
                  {user.initials}
                </span>
                <span className="hidden text-left xl:block">
                  <span className="block text-sm font-semibold leading-none">
                    {user.name}
                  </span>
                  <span className="mt-1 block text-xs text-muted">
                    {user.title}
                  </span>
                </span>
                <ChevronDown className="hidden size-4 text-muted xl:block" />
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-64 rounded-2xl border border-line bg-white p-2 shadow-xl"
                >
                  <div className="px-3 py-2">
                    <p className="text-sm font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-muted">{user.email}</p>
                  </div>
                  <button
                    role="menuitem"
                    onClick={() => {
                      logout()
                      navigate("/login")
                    }}
                    className="flex w-full items-center gap-3 border-t border-line px-3 py-3 text-sm font-semibold text-danger"
                  >
                    <LogOut className="size-4" /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="min-w-0 p-3 sm:p-5 lg:p-8">{children ?? <Outlet />}</main>
      </div>
    </div>
  )
}
