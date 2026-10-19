import {
  createContext,
  useEffect,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { Navigate } from "react-router"
import { api, tokenStore } from "../api"
import {
  Bot,
  Building2,
  CircleDollarSign,
  FileBarChart,
  FileCheck2,
  FileText,
  Gauge,
  History,
  Inbox,
  LayoutDashboard,
  Landmark,
  ReceiptText,
  ScrollText,
  ShieldCheck,
  Users,
  UserCog,
  UserRoundPlus,
  WalletCards,
  type LucideIcon,
} from "lucide-react"

export type Role = "owner" | "accountant" | "funder" | "admin"

export type AuthUser = {
  id: string
  role: Role
  name: string
  initials: string
  email: string
  businessId: string | null
  businessVerificationStatus?: "PENDING" | "VERIFIED" | "REJECTED" | null
  title: string
  organisation: string
  orgInitials: string
  greeting: string
}

export const roleHome: Record<Role, string> = {
  owner: "/app/owner",
  accountant: "/app/accountant",
  funder: "/funding/dashboard",
  admin: "/app/admin",
}

export const roleMeta: Record<
  Role,
  { label: string; blurb: string; icon: LucideIcon; tone: string }
> = {
  owner: {
    label: "Business owner",
    blurb: "Track money, create invoices and build a funding-readiness profile.",
    icon: Building2,
    tone: "bg-blue-soft text-brand-blue",
  },
  accountant: {
    label: "Accountant",
    blurb: "Review client books, reconcile records and sign off reports.",
    icon: FileBarChart,
    tone: "bg-green-soft text-accent",
  },
  funder: {
    label: "Funding partner",
    blurb: "Assess applications and review business financial profiles.",
    icon: Landmark,
    tone: "bg-warning-soft text-warning",
  },
  admin: {
    label: "Administrator",
    blurb: "Manage users, businesses and platform activity.",
    icon: ShieldCheck,
    tone: "bg-slate-100 text-brand",
  },
}

export type NavItem = readonly [string, string, LucideIcon]

export const navByRole: Record<Role, NavItem[]> = {
  owner: [
    ["Overview", "/app/owner", LayoutDashboard],
    ["Transactions", "/app/transactions", WalletCards],
    ["Income & expenses", "/app/income", CircleDollarSign],
    ["Invoices", "/app/invoices", ReceiptText],
    ["Cash flow", "/app/cash-flow", FileBarChart],
    ["Customers", "/app/customers", Users],
    ["Reports", "/app/reports", FileText],
    ["Funding readiness", "/app/funding-readiness", FileCheck2],
    ["Financial insights", "/app/ai-assistant", Bot],
    ["Team management", "/app/settings/team", UserRoundPlus],
    ["Business verification", "/app/settings/business-verification", ShieldCheck],
    ["Sharing permissions", "/app/funding-sharing", Landmark],
  ],
  accountant: [
    ["Overview", "/app/accountant", LayoutDashboard],
    ["Clients", "/app/clients", Building2],
    ["Review queue", "/app/review-queue", Inbox],
    ["Transactions", "/app/transactions", WalletCards],
    ["Reports", "/app/reports", FileText],
  ],
  funder: [
    ["Overview", "/app/funder", LayoutDashboard],
    ["Applications", "/app/applications", Inbox],
    ["Portfolio", "/app/portfolio", Gauge],
    ["Reports", "/app/reports", FileText],
  ],
  admin: [
    ["Overview", "/app/admin", LayoutDashboard],
    ["Users", "/app/users", UserCog],
    ["Businesses", "/app/businesses", Building2],
    ["Business verifications", "/app/business-verifications", ShieldCheck],
    ["Audit log", "/app/audit-log", ScrollText],
    ["Activity", "/app/activity", History],
    ["Accountant applications", "/app/accountant-applications", FileCheck2],
    ["Funding partners", "/app/funding-partners", Landmark],
  ],
}

export const roleSections: Record<Role, string[]> = {
  owner: [],
  accountant: ["clients", "review-queue"],
  funder: ["applications", "portfolio"],
  admin: ["users", "businesses", "audit-log", "activity", "accountant-applications", "funding-partners"],
}

type ApiUser = {
  id: string
  name: string
  email: string
  role: Role
  businessId: string | null
  businessName: string | null
  businessVerificationStatus?: "PENDING" | "VERIFIED" | "REJECTED" | null
}

type AuthValue = {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  acceptSession: (response: { token: string; user: ApiUser }) => AuthUser
  updateName: (name: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthValue | null>(null)

const initialsOf = (text: string) =>
  text
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("")

const titles: Record<Role, string> = {
  owner: "Business owner",
  accountant: "Accountant",
  funder: "Funding analyst",
  admin: "Platform administrator",
}

const orgFallback: Record<Role, string> = {
  owner: "My business",
  accountant: "Accountant workspace",
  funder: "Funding workspace",
  admin: "FinanceHub",
}

const greetings: Record<Role, (first: string) => string> = {
  owner: (f) => `Welcome, ${f}`,
  accountant: (f) => `Welcome, ${f}`,
  funder: () => "Funding desk",
  admin: () => "Platform control",
}

function fromApi(u: ApiUser): AuthUser {
  const organisation = u.businessName ?? orgFallback[u.role]
  return {
    id: u.id,
    role: u.role,
    name: u.name,
    businessId: u.businessId,
    businessVerificationStatus: u.businessVerificationStatus ?? null,
    initials: initialsOf(u.name) || "U",
    email: u.email,
    title: titles[u.role],
    organisation,
    orgInitials: initialsOf(organisation) || "FH",
    greeting: greetings[u.role](u.name.split(/\s+/)[0]),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(() => !!tokenStore.get())

  useEffect(() => {
    if (!tokenStore.get()) return
    api<ApiUser>("/auth/me")
      .then((u) => setUser(fromApi(u)))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false))
  }, [])

  const value = useMemo<AuthValue>(() => {
    const start = (res: { token: string; user: ApiUser }) => {
      tokenStore.set(res.token)
      const next = fromApi(res.user)
      setUser(next)
      return next
    }
    return {
      user,
      loading,
      login: async (email, password) =>
        start(await api("/auth/login", { method: "POST", body: { email: email.trim(), password } })),
      acceptSession: start,
      updateName: async (name) => {
        setUser(fromApi(await api<ApiUser>("/auth/me", { method: "PATCH", body: { name } })))
      },
      logout: () => {
        tokenStore.clear()
        setUser(null)
      },
    }
  }, [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="grid min-h-screen place-items-center text-sm text-muted">Loading your workspace…</div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export function RequireRoleAccess({ role, children }: { role: Role; children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="grid min-h-screen place-items-center text-sm text-muted">Loading your workspace…</div>
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to={roleHome[user.role]} replace />
  return <>{children}</>
}
