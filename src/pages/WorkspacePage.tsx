import {
  CheckCircle2,
  Download,
  FileCheck2,
  FileText,
  Filter,
  Plus,
  Search,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "react-router"
import { useAuth } from "../auth/auth"
import { FormModal, downloadCsv } from "../components/ui"
import { createTransaction, incomeRow, listTransactions, transactionsRow } from "../transactions"
import { AppShell } from "../components/AppShell"
import { api } from "../api"
import { useApi, zar } from "../useApi"

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
const invoiceStatus: Record<string, string> = {
  DRAFT: "Draft", SENT: "Sent", PARTIALLY_PAID: "Partially paid", PAID: "Paid", OVERDUE: "Overdue",
}
type Inv = { id: string; number: string; customer: string; status: string; balance: number; dueDate: string }
type Cus = { id: string; name: string; email: string | null; lastInvoice: string | null; outstanding: number; overdue: boolean }
type Rep = { id: string; name: string; period: string; format: string; generated: string; businessName: string }

const apiSections: Record<string, { path: string; fields: { name: string; label: string; type?: "text" | "number" | "date" | "email"; placeholder?: string }[] }> = {
  invoices: {
    path: "/invoices",
    fields: [
      { name: "customer", label: "Customer", placeholder: "e.g. Cedar Events" },
      { name: "amount", label: "Amount (ZAR)", type: "number", placeholder: "0.00" },
      { name: "dueDate", label: "Due date", type: "date" },
    ],
  },
  customers: {
    path: "/customers",
    fields: [
      { name: "name", label: "Customer name" },
      { name: "email", label: "Email (optional)", type: "email" },
    ],
  },
  reports: {
    path: "/reports",
    fields: [
      { name: "name", label: "Report name", placeholder: "e.g. Profit & loss" },
      { name: "period", label: "Period", placeholder: "e.g. Current month" },
    ],
  },
}

const pages: Record<string, { description: string; action: string; columns: string[] }> = {
  transactions: {
    description: "A complete register of recorded income and expenses.",
    action: "Add transaction",
    columns: ["Description", "Category", "Date", "Status", "Amount"],
  },
  income: {
    description: "Track every rand coming into and going out of your business.",
    action: "Add record",
    columns: ["Description", "Type", "Category", "Date", "Amount"],
  },
  invoices: {
    description: "Create and track customer invoices.",
    action: "Create invoice",
    columns: ["Invoice", "Customer", "Due date", "Status", "Balance"],
  },
  customers: {
    description: "Manage customer details, invoices and payment history.",
    action: "Add customer",
    columns: ["Customer", "Contact", "Last invoice", "Status", "Outstanding"],
  },
  reports: {
    description: "Record management reports for your business.",
    action: "Record report",
    columns: ["Report", "Period", "Generated", "Format", "Status"],
  },
}

export function WorkspacePage() {
  const { section = "transactions" } = useParams()
  const [notice, setNotice] = useState("")
  const [loadError, setLoadError] = useState("")
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get("q") ?? "")
  const [adding, setAdding] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [status, setStatus] = useState("All")
  const { user } = useAuth()
  const live = section === "transactions" || section === "income"
  const [liveRows, setLiveRows] = useState<string[][]>([])
  useEffect(() => {
    if (!live) return
    listTransactions()
      .then((list) =>
        setLiveRows(list.map(section === "income" ? incomeRow : transactionsRow)),
      )
      .catch((e: Error) => setLoadError(e.message))
  }, [live, section])
  const apiCfg = apiSections[section]
  const remote = useApi<{ data: unknown[] }>(apiCfg?.path ?? null)
  const remoteRows: string[][] = ((remote.data?.data ?? []) as unknown[]).map((item) => {
    if (section === "invoices") {
      const i = item as Inv
      return [i.number, i.customer, fmtDate(i.dueDate), invoiceStatus[i.status] ?? i.status, zar(i.balance)]
    }
    if (section === "customers") {
      const c = item as Cus
      return [c.name, c.email ?? "—", c.lastInvoice ?? "—", c.overdue ? "Payment due" : "Active", zar(c.outstanding)]
    }
    const r = item as Rep
    return [user?.role === "owner" ? r.name : `${r.name} · ${r.businessName}`, r.period, fmtDate(r.generated), r.format, "Recorded"]
  })
  if (section === "funding-readiness") return <FundingPage />
  if (section === "ai-assistant") return <AssistantPage />
  if (section === "cash-flow") return <CashFlowPage />
  const page = pages[section]
  if (!page) return <AppShell><p className="text-sm text-muted">This section is not available.</p></AppShell>
  const all = live ? liveRows : remoteRows
  const statuses = ["All", ...new Set(all.map((r) => r[r.length - 2]))]
  const rows = all.filter(
    (row) =>
      (status === "All" || row[row.length - 2] === status) &&
      row.join(" ").toLowerCase().includes(query.toLowerCase()),
  )
  const statusOptions = statuses.slice(1)
  const liveFields = [
    { name: "description", label: "Description", type: "text" as const },
    { name: "type", label: "Type", type: "select" as const, options: ["Income", "Expense"] },
    { name: "category", label: "Category", type: "text" as const },
    { name: "amount", label: "Amount (ZAR)", type: "number" as const, placeholder: "0.00" },
  ]
  return (
    <AppShell>
      {notice && (
        <div className="mb-5 flex items-center gap-2 rounded-xl bg-green-soft px-4 py-3 text-sm font-semibold text-accent">
          <CheckCircle2 className="size-4" />
          {notice}
        </div>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="text-sm text-muted">{page.description}</p>
        {user?.role === "owner" && (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white"
        >
          <Plus className="size-4" />
          {page.action}
        </button>
        )}
      </div>
      <div className="mt-6 rounded-2xl border border-line bg-white shadow-card">
        <div className="flex flex-wrap gap-3 border-b border-line p-4">
          <label className="flex min-w-60 flex-1 items-center gap-2 rounded-xl border border-line bg-canvas px-3 py-2.5">
            <Search className="size-4 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm outline-none"
              placeholder="Search records..."
            />
          </label>
          <div className="relative flex">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              aria-expanded={filterOpen}
              className="flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold"
            >
              <Filter className="size-4" />
              {status === "All" ? "Filter" : status}
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-full z-20 mt-2 w-48 rounded-xl border border-line bg-white p-1.5 shadow-xl">
                {statuses.map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setStatus(st)
                      setFilterOpen(false)
                    }}
                    className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-canvas ${st === status ? "text-brand-blue" : ""}`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => {
              downloadCsv(`${section}.csv`, page.columns, rows)
              setNotice(`Exported ${rows.length} records to ${section}.csv.`)
            }}
            className="flex items-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold"
          >
            <Download className="size-4" />
            Export
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-canvas text-[11px] uppercase tracking-wider text-muted">
              <tr>
                {page.columns.map((column) => (
                  <th
                    key={column}
                    className="px-6 py-3 font-semibold last:text-right"
                  >
                    {column}
                  </th>
                ))}
                {section === "invoices" && user?.role === "owner" && <th className="px-6 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((row, r) => (
                <tr key={row[0] + r}>
                  {row.map((cell, index) => (
                    <td
                      key={index}
                      className={`px-6 py-4 ${
                        index === 0 ? "font-bold" : "text-muted"
                      } ${
                        index === row.length - 1
                          ? "text-right font-bold text-ink"
                          : ""
                      }`}
                    >
                      {index === row.length - 2 ? (
                        <span className="rounded-full bg-blue-soft px-2.5 py-1 text-[11px] font-bold text-brand-blue">
                          {cell}
                        </span>
                      ) : (
                        cell
                      )}
                    </td>
                  ))}
                  {section === "invoices" && user?.role === "owner" && (
                    <td className="px-6 py-4 text-right">
                      {row[3] !== "Paid" && (
                        <button
                          onClick={async () => {
                            const inv = (remote.data?.data as Inv[] | undefined)?.find((x) => x.number === row[0])
                            if (!inv) {
                              setNotice("Invoice is no longer available. Refresh the list and try again.")
                              return
                            }
                            try {
                              await api(`/invoices/${inv.id}/paid`, { method: "PATCH" })
                              await remote.reload()
                              setNotice(`${inv.number} marked as paid.`)
                            } catch (e) {
                              setNotice((e as Error).message)
                            }
                          }}
                          className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold hover:border-brand-blue"
                        >
                          Mark paid
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className="px-6 py-8 text-center text-sm text-muted">
              {live
                ? loadError || "No transactions have been recorded yet."
                : remote.loading
                  ? "Loading records…"
                  : remote.error || "No records have been created yet."}
            </p>
          )}
        </div>
        <div className="flex justify-between border-t border-line px-6 py-4 text-xs text-muted">
          <span>{rows.length} records</span>
          <span>{live ? loadError || "Live data" : remote.error || (remote.data ? "Live data" : "")}</span>
        </div>
      </div>
      {adding && (
        <FormModal
          title={page.action}
          submitLabel="Save"
          fields={live ? liveFields : apiCfg?.fields ?? []}
          onClose={() => setAdding(false)}
          onSubmit={async (v) => {
            if (live) {
              try {
                const created = await createTransaction({
                  type: v.type === "Income" ? "INCOME" : "EXPENSE",
                  description: v.description,
                  category: v.category,
                  amount: Number(v.amount),
                })
                const map = section === "income" ? incomeRow : transactionsRow
                setLiveRows([map(created), ...liveRows])
                setNotice(`${created.description} added.`)
                setAdding(false)
              } catch (e) {
                setNotice((e as Error).message)
              }
              return
            }
            if (apiCfg) {
              try {
                const body = section === "invoices" ? { ...v, amount: Number(v.amount) } : v
                await api(apiCfg.path, { method: "POST", body })
                await remote.reload()
                setNotice(`${v.customer ?? v.name} added.`)
                setAdding(false)
              } catch (e) {
                setNotice((e as Error).message)
              }
              return
            }
            setNotice("This section cannot save records yet.")
          }}
        />
      )}
    </AppShell>
  )
}

type Readiness = { score: number; items: { id: string; label: string; complete: boolean }[] }
type App = { id: string; ref: string; purpose: string; amount: number; status: string }
const appStatus: Record<string, string> = {
  RECEIVED: "Received", ASSESSING: "Assessing", INFO_REQUESTED: "Info requested", APPROVED: "Approved", DECLINED: "Declined",
}

function FundingPage() {
  const ready = useApi<Readiness>("/funding/readiness")
  const verification = useApi<{ data: { overallStatus: string; business: { verificationStatus: string } } }>("/business-verifications/current-business")
  const apps = useApi<{ data: App[] }>("/applications")
  const [note, setNote] = useState("")
  const [applying, setApplying] = useState(false)
  const items = ready.data?.items ?? []
  const progress = ready.data?.score ?? 0
  const missing = items.filter((i) => !i.complete)
  const businessVerified = verification.data?.data.business.verificationStatus === "VERIFIED"
  const complete = async (id: string, label: string) => {
    try {
      ready.setData(await api<Readiness>(`/funding/readiness/${id}/complete`, { method: "POST" }))
      setNote(`${label} confirmed complete.`)
    } catch (e) {
      setNote((e as Error).message)
    }
  }
  return (
    <AppShell>
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <article className="rounded-2xl border border-line bg-white p-6 shadow-card">
          <div className="flex justify-between">
            <div>
              <p className="eyebrow">Your readiness score</p>
              <p className="mt-2 text-4xl font-extrabold">{ready.data ? `${progress}%` : "—"}</p>
              <p className="mt-2 text-sm text-muted">
                {ready.error || "Complete the remaining items to prepare your pack."}
              </p>
            </div>
            <span className="grid size-14 place-items-center rounded-2xl bg-green-soft text-accent">
              <FileCheck2 className="size-7" />
            </span>
          </div>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-canvas">
            <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-8 space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl border border-line p-4">
                <div className="flex items-center gap-3">
                  <span className={`grid size-8 place-items-center rounded-full ${item.complete ? "bg-green-soft text-accent" : "bg-canvas text-muted"}`}>
                    {item.complete ? <CheckCircle2 className="size-4" /> : <FileText className="size-4" />}
                  </span>
                  <div>
                    <p className="text-sm font-bold">{item.label}</p>
                    <p className="text-xs text-muted">{item.complete ? "Complete" : "Still required"}</p>
                  </div>
                </div>
                {!item.complete && (
                  <button
                    id={`missing-${item.id}`}
                    onClick={() => complete(item.id, item.label)}
                    className="rounded-lg border border-line px-3 py-2 text-xs font-bold"
                  >
                    <CheckCircle2 className="mr-1 inline size-3" />
                    Confirm complete
                  </button>
                )}
              </div>
            ))}
          </div>
        </article>
        <aside className="space-y-5">
          <div className="rounded-2xl bg-brand p-6 text-white">
            <h2 className="text-xl font-bold">Next best action</h2>
            <p className="mt-3 text-sm leading-6 text-white/60">
              {!businessVerified
                ? "Your business profile must be verified before you can apply for funding or share information with funders."
                : missing.length
                  ? `Next up: ${missing[0].label}.`
                  : "Your pack is complete. You can apply for funding."}
            </p>
            <button
              disabled={!businessVerified}
              onClick={() => {
                if (!missing.length) return setApplying(true)
                document.getElementById(`missing-${missing[0].id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
                document.getElementById(`missing-${missing[0].id}`)?.focus()
              }}
              className="mt-6 w-full rounded-xl bg-white py-3 text-sm font-bold text-brand disabled:cursor-not-allowed disabled:opacity-60"
            >
              {!businessVerified ? "Business verification required" : missing.length ? "Review missing items" : "Apply for funding"}
            </button>
            {note && <p role="status" className="mt-4 text-xs font-semibold text-mint">{note}</p>}
            <p className="mt-6 text-xs leading-5 text-white/40">
              Confirm items you have completed. Documents are not uploaded here;
              requirements vary by funder and approval is not guaranteed.
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Your applications</h2>
              <button
                onClick={() => setApplying(true)}
                disabled={!businessVerified}
                className="text-sm font-bold text-brand-blue disabled:cursor-not-allowed disabled:opacity-50"
              >
                New
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {(apps.data?.data ?? []).map((a) => (
                <div key={a.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-bold">{a.purpose}</p>
                    <p className="text-xs text-muted">{a.ref} · {zar(a.amount)}</p>
                  </div>
                  <span className="rounded-full bg-blue-soft px-2.5 py-1 text-[11px] font-bold text-brand-blue">{appStatus[a.status]}</span>
                </div>
              ))}
              {apps.data?.data.length === 0 && <p className="text-xs text-muted">No applications yet.</p>}
            </div>
          </div>
        </aside>
      </div>
      {applying && (
        <FormModal
          title="Apply for funding"
          submitLabel="Submit application"
          onClose={() => setApplying(false)}
          fields={[
            { name: "amount", label: "Amount requested (ZAR)", type: "number" },
            { name: "purpose", label: "Purpose", placeholder: "e.g. Kitchen equipment" },
          ]}
          onSubmit={async (v) => {
            try {
              await api("/applications", { method: "POST", body: { amount: Number(v.amount), purpose: v.purpose } })
              await apps.reload()
              setNote("Application submitted to funders.")
              setApplying(false)
            } catch (e) {
              setNote((e as Error).message)
            }
          }}
        />
      )}
    </AppShell>
  )
}

function AssistantPage() {
  const { data: sum, error, loading } = useApi<{
    cash: { inflows: number; outflows: number; projected: number; opening: number }
    attention: { overdueInvoices: number; overdueValue: number }
  }>("/dashboard/summary")
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl rounded-2xl border border-line bg-white p-6 shadow-card">
        <p className="eyebrow">Business insights</p>
        <h2 className="mt-2 text-2xl font-extrabold">Cash-flow outlook</h2>
        {!sum ? (
          <p className="mt-4 text-sm text-muted">
            {error || (loading ? "Loading your figures…" : "No cash-flow figures are available yet.")}
          </p>
        ) : (
          <>
            <p className="mt-3 text-sm leading-7 text-muted">
              Expected inflows of {zar(sum.cash.inflows)} compare with forecast
              outflows of {zar(sum.cash.outflows)}.{" "}
              {sum.attention.overdueInvoices
                ? `${zar(sum.attention.overdueValue)} in overdue invoices may affect your cash position.`
                : "There are no overdue invoices in your records."}
            </p>
            <dl className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ["Opening cash", sum.cash.opening],
                ["Expected inflows", sum.cash.inflows],
                ["Projected closing cash", sum.cash.projected],
              ].map(([label, amount]) => (
                <div key={label} className="rounded-xl bg-canvas p-4">
                  <dt className="text-xs text-muted">{label}</dt>
                  <dd className="mt-2 font-bold">{zar(Number(amount))}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 rounded-xl bg-warning-soft p-4 text-xs text-warning">
              These estimates are calculated from your recorded data and are not
              financial, tax or legal advice.
            </p>
          </>
        )}
      </div>
    </AppShell>
  )
}

function CashFlowPage() {
  const { data: sum, error } = useApi<{
    period: string
    cash: { opening: number; inflows: number; outflows: number; projected: number }
  }>("/dashboard/summary")
  return (
    <AppShell>
      <div className="grid gap-5 lg:grid-cols-3">
        {[
          ["Opening cash", sum && zar(sum.cash.opening), "Actual"],
          ["Expected inflows", sum && zar(sum.cash.inflows), "Forecast"],
          ["Expected outflows", sum && zar(sum.cash.outflows), "Forecast"],
        ].map(([label, value, type]) => (
          <div key={label as string} className="rounded-2xl border border-line bg-white p-6 shadow-card">
            <div className="flex justify-between">
              <p className="text-sm font-semibold text-muted">{label}</p>
              <span className="rounded-full bg-blue-soft px-2 py-1 text-[10px] font-bold text-brand-blue">{type}</span>
            </div>
            <p className="mt-4 text-3xl font-extrabold">{value || "—"}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-2xl border border-line bg-white p-6 shadow-card">
        <h2 className="font-bold">30-day cash forecast</h2>
        <p className="mt-1 text-xs text-muted">Current cash + expected inflows − expected outflows</p>
        <div className="mt-8 grid h-64 place-items-center rounded-xl bg-canvas text-center">
          <div>
            <p className="text-5xl font-extrabold text-brand">{sum ? zar(sum.cash.projected) : error || "—"}</p>
            <p className="mt-2 text-sm text-muted">Projected closing cash · 30 days after {sum?.period ?? "latest records"}</p>
          </div>
        </div>
        <p className="mt-5 text-xs text-muted">
          Projected figures are estimates. Unpaid invoices are not treated as actual cash received.
        </p>
      </div>
    </AppShell>
  )
}
