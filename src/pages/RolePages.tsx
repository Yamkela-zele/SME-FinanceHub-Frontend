import { useState, type ReactNode } from "react"
import { Navigate, useNavigate, useParams } from "react-router"
import {
  ArrowUpRight,
  Ban,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Search,
  Send,
  X,
} from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { AppShell } from "../components/AppShell"
import { Modal, downloadCsv, useToast } from "../components/ui"
import { roleHome, roleMeta, useAuth, type Role } from "../auth/auth"
import { api } from "../api"
import { useApi } from "../useApi"
import { DashboardPage } from "./DashboardPage"
import { WorkspacePage } from "./WorkspacePage"
import {
  AdminAccountantApplicationsPage,
  FundingPartnerManagementPage,
  FundingSharingPage,
  OwnerTeamPage,
} from "./OnboardingPages"
import { AdminBusinessVerificationPage } from "./BusinessVerificationPages"

const tones = {
  green: "bg-green-soft text-accent",
  blue: "bg-blue-soft text-brand-blue",
  amber: "bg-warning-soft text-warning",
  red: "bg-danger-soft text-danger",
  slate: "bg-slate-100 text-muted",
} as const
type Tone = keyof typeof tones

function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

function Card({
  title,
  note,
  action,
  children,
  className = "",
}: {
  title?: string
  note?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-2xl border border-line bg-white p-6 shadow-card ${className}`}
    >
      {title && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-bold">{title}</h2>
            {note && <p className="mt-1 text-xs text-muted">{note}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

function Stats({ items }: { items: [string, string, string][] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map(([label, value, note]) => (
        <div
          key={label}
          className="rounded-2xl border border-line bg-white p-5 shadow-card"
        >
          <p className="text-sm font-semibold text-muted">{label}</p>
          <p className="mt-3 text-3xl font-extrabold tracking-tight">{value}</p>
          <p className="mt-1.5 text-xs text-muted">{note}</p>
        </div>
      ))}
    </div>
  )
}

function Table({
  head,
  rows,
}: {
  head: string[]
  rows: ReactNode[][]
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-wider text-muted">
            {head.map((h) => (
              <th key={h} className="px-3 py-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-line/70 last:border-0">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`px-3 py-3.5 ${j === 0 ? "font-semibold" : "text-muted"}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Score({ value }: { value: number }) {
  const color =
    value >= 75 ? "bg-accent" : value >= 55 ? "bg-amber-500" : "bg-danger"
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-bold text-ink">{value}%</span>
    </div>
  )
}

function Intro({ children }: { children: ReactNode }) {
  return <p className="mb-6 text-sm text-muted">{children}</p>
}

function LinkButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} className="text-sm font-bold text-brand-blue">
      {children}
    </button>
  )
}

function RowButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-ink hover:bg-canvas">
      {children}
    </button>
  )
}

function DetailModal({
  title,
  facts,
  actionLabel,
  onAction,
  onClose,
}: {
  title: string
  facts: [string, ReactNode][]
  actionLabel: string
  onAction: () => void
  onClose: () => void
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <dl className="grid grid-cols-2 gap-3">
        {facts.map(([k, v]) => (
          <div key={k} className="rounded-xl bg-canvas p-4">
            <dt className="text-xs text-muted">{k}</dt>
            <dd className="mt-1 text-sm font-bold">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold">
          Close
        </button>
        <button onClick={onAction} className="rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white">
          {actionLabel}
        </button>
      </div>
    </Modal>
  )
}

/* ───────────── Accountant ───────────── */

type Biz = {
  id: string
  name: string
  tradingName?: string | null
  businessType?: string | null
  industry?: string | null
  registrationStatus?: string | null
  registrationNumber?: string | null
  address?: string | null
  province?: string | null
  municipality?: string | null
  description?: string | null
  website?: string | null
  verificationNotes?: string | null
  verifiedAt?: string | null
  owner?: { name: string; email: string } | null
  verification?: { id: string; reference: string; status: string; businessCheck: string; representativeCheck: string; submittedAt: string } | null
  sector: string | null
  plan: string
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED"
  readiness: number
  registered: string
  monthIncome: number
  toReview: number
  signedOff: boolean
}
const formatStatusLabel = (status: string) =>
  status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
type QueueItem = {
  id: string
  description: string
  businessName: string
  date: string
  amount: number
  issue: string | null
  reviewed: boolean
}
type AccSummary = {
  clients: number
  toReview: number
  avgReadiness: number
  pendingSignoff: number
  signoffCandidates: { id: string; name: string; signedOff: boolean }[]
  attention: { id: string; description: string; client: string; amount: number; issue: string }[]
}

const rand = (n: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(n)
const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", timeZone: "UTC" })
const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })

function Loading({ error }: { error?: string }) {
  return <p className="py-8 text-center text-sm text-muted">{error || "Loading…"}</p>
}

function AccountantDashboard() {
  const navigate = useNavigate()
  const [toast, notify] = useToast()
  const { data, error, reload } = useApi<AccSummary>("/businesses/summary")
  const signOff = async (id: string, name: string) => {
    try {
      await api(`/businesses/${id}/signoff`, { method: "POST" })
      notify(`${name} signed off.`)
      await reload()
    } catch (e) {
      notify((e as Error).message)
    }
  }
  if (!data) return <AppShell><Loading error={error} /></AppShell>
  return (
    <AppShell>
      <Intro>{data.clients} client businesses, one view.</Intro>
      <Stats
        items={[
          ["Active clients", String(data.clients), "Under your practice"],
          ["Items to review", String(data.toReview), "Across all clients"],
          ["Awaiting sign-off", String(data.pendingSignoff), "Clean books, not yet signed"],
          ["Avg. readiness score", `${data.avgReadiness}%`, "Across clients"],
        ]}
      />
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Card
          title="Needs attention"
          note="Oldest items first"
          action={<LinkButton onClick={() => navigate("/app/review-queue")}>Open review queue</LinkButton>}
        >
          <Table
            head={["Item", "Client", "Amount", "Issue"]}
            rows={data.attention.map((a) => [a.description, a.client, rand(a.amount), <Badge key={a.id} tone="amber">{a.issue}</Badge>])}
          />
          {data.attention.length === 0 && <p className="py-6 text-center text-sm text-muted">Nothing to review.</p>}
        </Card>
        <Card title="Month-end sign-off" note="Clients with fully reviewed books">
          <ul className="space-y-3">
            {data.signoffCandidates.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-xl bg-canvas p-3">
                <span className="text-sm font-semibold">{c.name}</span>
                {c.signedOff ? (
                  <Badge tone="green">Signed off</Badge>
                ) : (
                  <button onClick={() => signOff(c.id, c.name)} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white">
                    Sign off
                  </button>
                )}
              </li>
            ))}
            {data.signoffCandidates.length === 0 && <p className="text-sm text-muted">Clear remaining review items to sign off.</p>}
          </ul>
        </Card>
      </div>
      {toast}
    </AppShell>
  )
}

function ClientsPage() {
  const [toast, notify] = useToast()
  const { data, error } = useApi<{ data: Biz[] }>("/businesses")
  const [open, setOpen] = useState<Biz | null>(null)
  const [q, setQ] = useState("")
  const rows = (data?.data ?? []).filter((b) => b.name.toLowerCase().includes(q.toLowerCase()))
  const books = (b: Biz): [Tone, string] =>
    b.toReview === 0 ? ["green", "Up to date"] : [b.toReview > 2 ? "red" : "amber", `${b.toReview} to review`]
  return (
    <AppShell>
      <Intro>Every business you manage, with record health at a glance.</Intro>
      <Card>
        <label className="mb-4 flex max-w-sm items-center gap-2 rounded-xl border border-line bg-canvas px-3 py-2.5 text-muted">
          <Search className="size-4" />
          <input value={q} onChange={(e) => setQ(e.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Search clients" />
        </label>
        <Table
          head={["Client", "Sector", "Readiness", "Books", "Month income", ""]}
          rows={rows.map((c) => [
            c.name,
            c.sector ?? "—",
            <Score key="s" value={c.readiness} />,
            <Badge key="b" tone={books(c)[0]}>{books(c)[1]}</Badge>,
            rand(c.monthIncome),
            <RowButton key="v" onClick={() => setOpen(c)}>View</RowButton>,
          ])}
        />
        {!data ? <Loading error={error} /> : rows.length === 0 && <p className="py-8 text-center text-sm text-muted">No clients match.</p>}
      </Card>
      {toast}
      {open && (
        <DetailModal
          title={open.name}
          onClose={() => setOpen(null)}
          actionLabel="Record request"
          onAction={async () => {
            try {
              await api(`/businesses/${open.id}/notify`, { method: "POST", body: { kind: "records" } })
              notify(`Records request recorded for ${open.name}.`)
            } catch (e) {
              notify((e as Error).message)
            }
            setOpen(null)
          }}
          facts={[
            ["Sector", open.sector ?? "—"],
            ["Month income", rand(open.monthIncome)],
            ["Books", books(open)[1]],
            ["Readiness", `${open.readiness}%`],
          ]}
        />
      )}
    </AppShell>
  )
}

function ReviewQueuePage() {
  const [toast, notify] = useToast()
  const { data, setData, error } = useApi<{ data: QueueItem[] }>("/transactions?reviewed=false")
  const open = data?.data ?? []
  const approve = async (t: QueueItem) => {
    try {
      await api(`/transactions/${t.id}/review`, { method: "PATCH" })
      setData({ data: open.filter((x) => x.id !== t.id) })
      notify(`${t.description} approved.`)
    } catch (e) {
      notify((e as Error).message)
    }
  }
  return (
    <AppShell>
      <Intro>{!data ? "Loading…" : open.length ? `${open.length} items are waiting for your decision.` : "Queue cleared. Nice work."}</Intro>
      <Card>
        <Table
          head={["Item", "Client", "Date", "Amount", "Issue", ""]}
          rows={open.map((t) => [
            t.description,
            t.businessName,
            shortDate(t.date),
            rand(t.amount),
            <Badge key="i" tone="amber">{t.issue ?? "Needs review"}</Badge>,
            <button key="a" onClick={() => approve(t)} className="flex items-center gap-1 rounded-lg bg-green-soft px-3 py-1.5 text-xs font-bold text-accent">
              <Check className="size-3.5" /> Approve
            </button>,
          ])}
        />
        {error && <Loading error={error} />}
      </Card>
      {toast}
    </AppShell>
  )
}

/* ───────────── Funder ───────────── */

type App = {
  id: string
  ref: string
  business: string
  sector: string | null
  amount: number
  repaid: number
  purpose: string
  score: number
  avgIncome: number
  months: number
  status: string
  createdAt: string
}
type FunderSummary = {
  newCount: number
  pipelineValue: number
  pipelineCount: number
  approvalRate: number | null
  avgReadiness: number
  stages: { stage: string; count: number }[]
  latest: App[]
}
const statusLabel: Record<string, string> = {
  RECEIVED: "Received", ASSESSING: "Assessing", INFO_REQUESTED: "Info requested", APPROVED: "Approved", DECLINED: "Declined",
}
const statusTone: Record<string, Tone> = {
  RECEIVED: "blue", ASSESSING: "blue", INFO_REQUESTED: "amber", APPROVED: "green", DECLINED: "red",
}

function FunderDashboard() {
  const navigate = useNavigate()
  const { data, error } = useApi<FunderSummary>("/applications/summary")
  if (!data) return <AppShell><Loading error={error} /></AppShell>
  return (
    <AppShell>
      <Intro>Applications from SMMEs with FinanceHub-verified records.</Intro>
      <Stats
        items={[
          ["New applications", String(data.newCount), "Awaiting first assessment"],
          ["In pipeline", rand(data.pipelineValue), `${data.pipelineCount} open applications`],
          ["Approval rate", data.approvalRate === null ? "—" : `${data.approvalRate}%`, "Of decided applications"],
          ["Avg. readiness", `${data.avgReadiness}%`, "Across open applications"],
        ]}
      />
      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1.2fr]">
        <Card title="Pipeline by stage" note="Number of applications">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.stages}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="stage" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={28} allowDecimals={false} />
                <Tooltip cursor={{ fill: "#f6f8fb" }} />
                <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Latest applications" action={<LinkButton onClick={() => navigate("/app/applications")}>View all</LinkButton>}>
          <Table
            head={["Business", "Request", "Readiness"]}
            rows={data.latest.map((a) => [a.business, rand(a.amount), <Score key="s" value={a.score} />])}
          />
        </Card>
      </div>
    </AppShell>
  )
}

function ApplicationsPage() {
  const [toast, notify] = useToast()
  const { data, setData, error } = useApi<{ data: App[] }>("/applications")
  const [selected, setSelected] = useState<string | null>(null)
  const apps = data?.data ?? []
  const app = apps.find((a) => a.id === selected) ?? apps[0]
  const decide = async (status: string) => {
    try {
      const res = await api<{ data: App }>(`/applications/${app.id}/decision`, { method: "PATCH", body: { status } })
      setData({ data: apps.map((a) => (a.id === app.id ? res.data : a)) })
      notify(`${app.business}: ${statusLabel[status].toLowerCase()}.`)
    } catch (e) {
      notify((e as Error).message)
    }
  }
  if (!app) return <AppShell><Loading error={data ? "No applications yet." : error} /></AppShell>
  const decided = app.status === "APPROVED" || app.status === "DECLINED"
  return (
    <AppShell>
      <div className="grid gap-5 xl:grid-cols-[1fr_1.1fr]">
        <Card title="Applications" note="Select one to review its profile">
          <ul className="space-y-2">
            {apps.map((a) => (
              <li key={a.id}>
                <button
                  onClick={() => setSelected(a.id)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border p-4 text-left ${a.id === app.id ? "border-brand-blue bg-blue-soft" : "border-line hover:bg-canvas"}`}
                >
                  <span>
                    <span className="block text-sm font-bold">{a.business}</span>
                    <span className="block text-xs text-muted">{a.ref} · {rand(a.amount)}</span>
                  </span>
                  <Badge tone={statusTone[a.status]}>{statusLabel[a.status]}</Badge>
                </button>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <p className="eyebrow">{app.ref}</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight">{app.business}</h2>
          <p className="mt-1 text-sm text-muted">{app.sector ?? "—"} · {app.purpose}</p>
          <dl className="mt-6 grid grid-cols-2 gap-3">
            {[
              ["Requested", rand(app.amount)],
              ["Avg. monthly income", rand(app.avgIncome)],
              ["Months of records", `${app.months}`],
              ["Submitted", longDate(app.createdAt)],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-canvas p-4">
                <dt className="text-xs text-muted">{k}</dt>
                <dd className="mt-1 text-sm font-bold">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 rounded-xl bg-canvas p-4">
            <p className="text-xs text-muted">Funding readiness score</p>
            <div className="mt-2"><Score value={app.score} /></div>
          </div>
          {decided ? (
            <p className="mt-6 flex items-center gap-2 rounded-xl bg-blue-soft p-4 text-sm font-semibold text-brand-blue">
              <CheckCircle2 className="size-4" /> {statusLabel[app.status]}
              <button onClick={() => decide("ASSESSING")} className="ml-auto text-xs font-bold underline">Reopen</button>
            </p>
          ) : (
            <div className="mt-6 flex flex-wrap gap-2">
              <button onClick={() => decide("APPROVED")} className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white">
                <Check className="size-4" /> Approve
              </button>
              <button onClick={() => decide("INFO_REQUESTED")} className="flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-bold">
                <Send className="size-4" /> Request info
              </button>
              <button onClick={() => decide("DECLINED")} className="flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-bold text-danger">
                <X className="size-4" /> Decline
              </button>
            </div>
          )}
        </Card>
      </div>
      {toast}
    </AppShell>
  )
}

function PortfolioPage() {
  const [toast, notify] = useToast()
  const { data, error } = useApi<{ data: App[] }>("/applications/portfolio")
  const facilities = data?.data ?? []
  const funded = facilities.reduce((s, f) => s + f.amount, 0)
  const repaid = facilities.reduce((s, f) => s + f.repaid, 0)
  return (
    <AppShell>
      <Intro>Approved funding applications and repayments recorded in FinanceHub.</Intro>
      <Stats
        items={[
          ["Funded", rand(funded), `${facilities.length} active facilities`],
          ["Repaid to date", rand(repaid), funded ? `${Math.round((repaid / funded) * 100)}% of principal` : "—"],
          ["Outstanding", rand(funded - repaid), "Principal remaining"],
          ["Repayment risk", "Not tracked", "No arrears assessment available"],
        ]}
      />
      <Card className="mt-5" title="Active facilities">
        <Table
          head={["Business", "Facility", "Funded", "Outstanding", "Status", ""]}
          rows={facilities.map((f) => [
            f.business,
            f.purpose,
            rand(f.amount),
            rand(f.amount - f.repaid),
            <Badge key="s" tone="green">{statusLabel[f.status] ?? f.status}</Badge>,
            <RowButton
              key="d"
              onClick={() => {
                downloadCsv(`${f.business.replace(/\W+/g, "-").toLowerCase()}-summary.csv`, ["Business", "Facility", "Funded", "Repaid", "Outstanding"], [[f.business, f.purpose, String(f.amount), String(f.repaid), String(f.amount - f.repaid)]])
                notify(`Summary for ${f.business} downloaded.`)
              }}
            >
              Export summary
            </RowButton>,
          ])}
        />
        {!data && <Loading error={error} />}
      </Card>
      {toast}
    </AppShell>
  )
}

/* ───────────── Admin ───────────── */

type U = { id: string; name: string; email: string; role: string; organisation: string; status: string }
type AdminSummary = {
  businesses: number
  activeUsers: number
  pendingUsers: number
  newBusinesses: number
  events24h: number
  daily: { d: string; v: number }[]
}

function AdminDashboard() {
  const { data, error } = useApi<AdminSummary>("/admin/summary")
  if (!data) return <AppShell><Loading error={error} /></AppShell>
  return (
    <AppShell>
      <Intro>Health and growth of the FinanceHub platform.</Intro>
      <Stats
        items={[
          ["Registered businesses", String(data.businesses), `+${data.newBusinesses} this week`],
          ["Active users", String(data.activeUsers), "All roles"],
          ["Awaiting verification", String(data.pendingUsers), "Needs admin action"],
          ["Audit events (24h)", String(data.events24h), "Recorded actions"],
        ]}
      />
      <Card className="mt-5" title="Daily active users" note="Unique sign-ins, last 7 days">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.daily}>
              <defs>
                <linearGradient id="adm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="d" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} width={36} allowDecimals={false} />
              <Tooltip />
              <Area dataKey="v" stroke="#2563eb" strokeWidth={2} fill="url(#adm)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </AppShell>
  )
}

function UsersPage() {
  const [toast, notify] = useToast()
  const { user: me } = useAuth()
  const { data, setData, error } = useApi<{ data: U[] }>("/admin/users")
  const users = data?.data ?? []
  const set = async (u: U, status: "ACTIVE" | "SUSPENDED") => {
    try {
      const res = await api<{ data: U }>(`/admin/users/${u.id}/status`, { method: "PATCH", body: { status } })
      setData({ data: users.map((x) => (x.id === u.id ? res.data : x)) })
      notify(`${u.name} is now ${status === "ACTIVE" ? "active" : "suspended"}.`)
    } catch (e) {
      notify((e as Error).message)
    }
  }
  const tone: Record<string, Tone> = {
    ACTIVE: "green",
    PENDING_EMAIL_VERIFICATION: "amber",
    PENDING_ADMIN_REVIEW: "amber",
    PENDING_ACTIVATION: "amber",
    SUSPENDED: "red",
    REJECTED: "red",
    CLOSED: "slate",
  }
  const label = (status: string) => status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
  return (
    <AppShell>
      <Intro>Approve pending accounts and suspend access when needed.</Intro>
      <Card>
        <Table
          head={["Name", "Role", "Organisation", "Status", ""]}
          rows={users.map((u) => [
            <span key="n">
              {u.name}
              <span className="block text-xs font-normal text-muted">{u.email}</span>
            </span>,
            u.role,
            u.organisation,
            <Badge key="s" tone={tone[u.status] ?? "slate"}>{label(u.status)}</Badge>,
            u.id === me?.id ? null : u.status === "PENDING_ADMIN_REVIEW" ? (
              <button key="a" onClick={() => set(u, "ACTIVE")} className="rounded-lg bg-green-soft px-3 py-1.5 text-xs font-bold text-accent">Approve</button>
            ) : u.status === "ACTIVE" ? (
              <button key="a" onClick={() => set(u, "SUSPENDED")} className="flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-danger">
                <Ban className="size-3.5" /> Suspend
              </button>
            ) : u.status === "SUSPENDED" ? (
              <button key="a" onClick={() => set(u, "ACTIVE")} className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold">Restore</button>
            ) : null,
          ])}
        />
        {!data && <Loading error={error} />}
      </Card>
      {toast}
    </AppShell>
  )
}

function BusinessesPage() {
  const [toast, notify] = useToast()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data, error, reload } = useApi<{ data: Biz[] }>(user?.role === "admin" ? "/admin/businesses" : "/businesses")
  const [open, setOpen] = useState<Biz | null>(null)
  return (
    <AppShell>
      <Intro>SMMEs registered on the platform.</Intro>
      <Card>
        <Table
          head={["Business", "Sector", "Verification", "Registered", "Readiness", "Plan", ""]}
          rows={(data?.data ?? []).map((b) => [
            b.name,
            b.sector ?? "—",
            <Badge key="verification" tone={b.verificationStatus === "VERIFIED" ? "green" : b.verificationStatus === "REJECTED" ? "red" : "amber"}>
              {formatStatusLabel(user?.role === "admin" ? b.verification?.status ?? "NOT_SUBMITTED" : b.verificationStatus)}
            </Badge>,
            longDate(b.registered),
            <Score key="s" value={b.readiness} />,
            b.plan,
            <RowButton key="actions" onClick={() => setOpen(b)}>Review</RowButton>,
          ])}
        />
        {!data && <Loading error={error} />}
      </Card>
      {toast}
      {open && (
        <DetailModal
          title={open.name}
          onClose={() => setOpen(null)}
          actionLabel={user?.role === "admin" ? "Open verification review" : "Record reminder"}
          onAction={async () => {
            try {
              if (user?.role === "admin") {
                navigate("/app/business-verifications")
              } else {
                await api(`/businesses/${open.id}/notify`, { method: "POST", body: { kind: "reminder" } })
                notify(`Reminder recorded for ${open.name}.`)
              }
            } catch (e) {
              notify((e as Error).message)
            }
            setOpen(null)
          }}
          facts={[
            ["Sector", open.sector ?? "—"],
            ["Registered", longDate(open.registered)],
            ["Readiness", `${open.readiness}%`],
            ["Verification", formatStatusLabel(open.verificationStatus)],
            ...(open.owner ? [["Owner", `${open.owner.name} · ${open.owner.email}`] as [string, string]] : []),
            ...(open.businessType ? [["Business type", formatStatusLabel(open.businessType)] as [string, string]] : []),
            ...(open.registrationStatus ? [["Registration status", formatStatusLabel(open.registrationStatus)] as [string, string]] : []),
            ...(open.registrationNumber ? [["Registration number", open.registrationNumber] as [string, string]] : []),
            ...(open.address ? [["Address", [open.address, open.municipality, open.province].filter(Boolean).join(", ")] as [string, string]] : []),
            ...(open.verificationNotes ? [["Verification notes", open.verificationNotes] as [string, string]] : []),
            ...(open.description ? [["Business description", open.description] as [string, string]] : []),
            ["Plan", open.plan],
          ]}
        />
      )}
    </AppShell>
  )
}

type AuditRow = { id: string; at: string; actor: string; action: string; target: string }
const auditTone = (a: string): Tone =>
  /suspend|fail|declin/i.test(a) ? "red" : /approv|restor|sign/i.test(a) ? "green" : /request|remind|submit/i.test(a) ? "amber" : /login|register/i.test(a) ? "slate" : "blue"
const stamp = (iso: string) =>
  new Date(iso).toLocaleString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })

function AuditPage() {
  const [toast, notify] = useToast()
  const { data, error } = useApi<{ data: AuditRow[] }>("/admin/audit?limit=100")
  const audit = data?.data ?? []
  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Every sensitive action is recorded for accountability.</p>
        <button
          onClick={() => {
            downloadCsv("audit-log.csv", ["Time", "Actor", "Action", "Target"], audit.map((a) => [a.at, a.actor, a.action, a.target]))
            notify("Audit log exported.")
          }}
          className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-bold"
        >
          Export CSV
        </button>
      </div>
      {toast}
      <Card>
        <Table
          head={["Time", "Actor", "Action", "Target"]}
          rows={audit.map((a) => [stamp(a.at), a.actor, <Badge key={a.id} tone={auditTone(a.action)}>{a.action}</Badge>, a.target || "—"])}
        />
        {!data && <Loading error={error} />}
      </Card>
    </AppShell>
  )
}

function ActivityPage() {
  const { data, error } = useApi<{ data: AuditRow[] }>("/admin/audit?limit=12")
  const summary = useApi<AdminSummary>("/admin/summary").data
  return (
    <AppShell>
      <Intro>
        Live platform signals{summary ? ` · ${summary.pendingUsers} accounts awaiting approval, ${summary.events24h} events in 24h` : ""}.
      </Intro>
      <Card>
        <ul className="divide-y divide-line">
          {(data?.data ?? []).map((a) => {
            const Icon = /suspend|declin/i.test(a.action) ? CircleAlert : /login|register/i.test(a.action) ? Clock3 : CheckCircle2
            return (
              <li key={a.id} className="flex items-center gap-3 py-4">
                <Icon className="size-5 text-brand-blue" />
                <span className="flex-1 text-sm font-semibold">
                  {a.actor} · {a.action}{a.target ? ` · ${a.target}` : ""}
                </span>
                <span className="text-xs text-muted">{stamp(a.at)}</span>
              </li>
            )
          })}
        </ul>
        {!data && <Loading error={error} />}
      </Card>
    </AppShell>
  )
}

/* ───────────── Settings & routing ───────────── */

function SettingsPage() {
  const { user, updateName } = useAuth()
  const [toast, notify] = useToast()
  const [name, setName] = useState(user?.name ?? "")
  if (!user) return null
  const meta = roleMeta[user.role]
  return (
    <AppShell>
      <Card title="Profile" note={`${meta.label} · ${user.organisation}`}>
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            try {
              await updateName(name.trim())
              notify("Profile saved.")
            } catch (err) {
              notify((err as Error).message)
            }
          }}
          className="max-w-md space-y-4"
        >
          <label className="block">
            <span className="form-label">Full name</span>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="form-input" />
          </label>
          <label className="block">
            <span className="form-label">Email</span>
            <input disabled value={user.email} className="form-input bg-canvas text-muted" />
          </label>
          <button className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white">Save profile</button>
        </form>
      </Card>
      {toast}
    </AppShell>
  )
}

export function RoleRedirect() {
  const { user } = useAuth()
  return <Navigate to={user ? roleHome[user.role] : "/login"} replace />
}

export function RoleDashboard({ role }: { role: Role }) {
  const { user } = useAuth()
  if (user && user.role !== role) {
    return <Navigate to={roleHome[user.role]} replace />
  }
  switch (role) {
    case "accountant":
      return <AccountantDashboard />
    case "funder":
      return <FunderDashboard />
    case "admin":
      return <AdminDashboard />
    default:
      return <DashboardPage />
  }
}

const sectionPages: Record<string, Record<string, () => ReactNode>> = {
  accountant: { clients: ClientsPage, "review-queue": ReviewQueuePage },
  funder: { applications: ApplicationsPage, portfolio: PortfolioPage },
  admin: {
    users: UsersPage,
    businesses: BusinessesPage,
    "audit-log": AuditPage,
    activity: ActivityPage,
    "accountant-applications": AdminAccountantApplicationsPage,
    "funding-partners": FundingPartnerManagementPage,
    "business-verifications": AdminBusinessVerificationPage,
  },
  owner: {
    "funding-sharing": FundingSharingPage,
  },
}

const sharedSections: Record<string, string[]> = {
  owner: [
    "transactions", "income", "invoices", "cash-flow",
    "customers", "reports", "funding-readiness", "ai-assistant",
  ],
  accountant: ["transactions", "reports"],
  funder: ["reports"],
  admin: [],
}

export function SectionRouter() {
  const { user } = useAuth()
  const { section = "" } = useParams()
  if (!user) return null
  if (section === "settings") return <SettingsPage />
  if (section === "team") return <OwnerTeamPage />
  const Page = sectionPages[user.role]?.[section]
  if (Page) return <Page />
  if (sharedSections[user.role].includes(section)) return <WorkspacePage />
  return <Navigate to="/app/dashboard" replace />
}
