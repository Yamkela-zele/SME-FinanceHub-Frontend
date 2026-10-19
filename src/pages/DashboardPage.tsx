import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileText,
  Plus,
  Receipt,
  Wallet,
} from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { AppShell } from "../components/AppShell"
import { FormModal, useToast } from "../components/ui"
import { createTransaction, dashboardRow, listTransactions } from "../transactions"
import { useApi, zar } from "../useApi"

const periods: [string, number][] = [
  ["Last 3 months", 3],
  ["Last 6 months", 6],
]

type Summary = {
  businessName: string
  period: string
  series: { month: string; income: number; expenses: number }[]
  kpis: {
    income: { value: number; change: number | null }
    expenses: { value: number; change: number | null }
    net: { value: number; change: number | null }
    outstanding: { value: number; count: number; overdueValue: number; overdueCount: number }
  }
  cash: { opening: number; inflows: number; outflows: number; projected: number }
  attention: { overdueInvoices: number; overdueValue: number; needReview: number }
}
const changeText = (c: number | null) => (c === null ? "—" : `${Math.abs(c)}%`)
const money = (value: number) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(value)

export function DashboardPage() {
  const navigate = useNavigate()
  const [toast, notify] = useToast()
  const [months, setMonths] = useState(6)
  const [periodOpen, setPeriodOpen] = useState(false)
  const [rows, setRows] = useState<string[][]>([])
  const [loadError, setLoadError] = useState("")
  useEffect(() => {
    listTransactions()
      .then((list) => setRows(list.map(dashboardRow)))
      .catch((e: Error) => setLoadError(e.message))
  }, [])
  const summary = useApi<Summary>("/dashboard/summary")
  const businessVerification = useApi<{ data: { overallStatus: string; verification: { reviewReason: string | null } | null } }>("/business-verifications/current-business")
  const sum = summary.data
  const [modal, setModal] = useState<"income" | "expense" | null>(null)
  const periodLabel = periods.find(([, m]) => m === months)![0]
  const addRow = async (v: Record<string, string>) => {
    const income = modal === "income"
    try {
      const created = await createTransaction({
        type: income ? "INCOME" : "EXPENSE",
        description: v.description,
        category: v.category,
        amount: Number(v.amount),
      })
      setRows([dashboardRow(created), ...rows])
      void summary.reload()
      notify(`${income ? "Income" : "Expense"} recorded.`)
      setModal(null)
    } catch (e) {
      notify((e as Error).message)
    }
  }
  const actions = {
    income: ["Add income", ["Sales", "Services", "Other income"]],
    expense: ["Add expense", ["Equipment", "Stock", "Communication", "Rent", "Other"]],
  } as const
  return (
    <AppShell>
      <section className={`mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${businessVerification.data?.data.overallStatus === "MANUALLY_VERIFIED" || businessVerification.data?.data.overallStatus === "AUTOMATICALLY_VERIFIED" ? "border-green-200 bg-green-soft" : "border-amber-200 bg-warning-soft"}`}>
        <div>
          <p className="text-sm font-bold">Business verification: {businessVerification.data?.data.overallStatus?.replace(/_/g, " ").toLowerCase() ?? "Loading status"}</p>
          <p className="mt-1 text-xs text-muted">
            {businessVerification.error || (businessVerification.data?.data.verification?.reviewReason
              ?? (businessVerification.data?.data.overallStatus === "MANUALLY_VERIFIED"
                ? "Required business and representative checks have been reviewed."
                : "Verification is required for some funding and information-sharing features."))}
          </p>
        </div>
        <button onClick={() => navigate("/app/settings/business-verification")} className="rounded-lg border border-line bg-white px-3 py-2 text-xs font-bold">
          {businessVerification.data?.data.overallStatus === "NOT_SUBMITTED" || !businessVerification.data ? "Start verification" : "Review verification"}
        </button>
      </section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {sum ? `Here’s how ${sum.businessName} is performing in ${sum.period}.` : summary.error || "Loading your figures…"}
        </p>
        <div className="relative">
          <button
            onClick={() => setPeriodOpen(!periodOpen)}
            aria-expanded={periodOpen}
            className="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold shadow-sm"
          >
            <CalendarDays className="size-4 text-muted" /> {periodLabel}
          </button>
          {periodOpen && (
            <div className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-line bg-white p-1.5 shadow-xl">
              {periods.map(([label, m]) => (
                <button
                  key={label}
                  onClick={() => {
                    setMonths(m)
                    setPeriodOpen(false)
                  }}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-canvas ${m === months ? "text-brand-blue" : ""}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(sum
          ? [
              ["Total income", zar(sum.kpis.income.value), changeText(sum.kpis.income.change), "vs. last month", (sum.kpis.income.change ?? 0) >= 0],
              ["Total expenses", zar(sum.kpis.expenses.value), changeText(sum.kpis.expenses.change), "vs. last month", (sum.kpis.expenses.change ?? 0) <= 0 ? true : false],
              ["Net difference", zar(sum.kpis.net.value), changeText(sum.kpis.net.change), "Income − expenses", (sum.kpis.net.change ?? 0) >= 0],
              ["Outstanding invoices", zar(sum.kpis.outstanding.value), `${sum.kpis.outstanding.count} invoices`, `${zar(sum.kpis.outstanding.overdueValue)} overdue`, null],
            ]
          : []
        ).map(([label, value, meta, detail, up]) => (
          <article
            key={label as string}
            className="rounded-2xl border border-line bg-white p-5 shadow-card"
          >
            <div className="flex items-start justify-between">
              <p className="text-sm font-semibold text-muted">
                {label as string}
              </p>
              <span className="grid size-9 place-items-center rounded-xl bg-canvas text-brand-blue">
                {String(label).includes("invoice") ? (
                  <Receipt className="size-4" />
                ) : (
                  <Wallet className="size-4" />
                )}
              </span>
            </div>
            <p className="mt-4 text-2xl font-extrabold tracking-tight">
              {value as string}
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              <span
                className={`flex items-center gap-0.5 font-bold ${
                  up === false
                    ? "text-danger"
                    : up
                      ? "text-accent"
                      : "text-warning"
                }`}
              >
                {up === false ? (
                  <ArrowDownRight className="size-3.5" />
                ) : up ? (
                  <ArrowUpRight className="size-3.5" />
                ) : null}
                {meta as string}
              </span>
              <span className="text-muted">{detail as string}</span>
            </div>
          </article>
        ))}
      </section>
      <section className="mt-5 grid gap-5 xl:grid-cols-[1.65fr_1fr]">
        <article className="rounded-2xl border border-line bg-white p-5 shadow-card md:p-6">
          <div className="flex flex-wrap justify-between gap-3">
            <div>
              <h2 className="font-bold">Income vs. expenses</h2>
              <p className="mt-1 text-xs text-muted">
                Recorded totals over the last {months} months
              </p>
            </div>
            <div className="flex gap-4 text-xs font-semibold">
              <span className="flex items-center gap-2">
                <i className="size-2 rounded-full bg-brand-blue" />
                Income
              </span>
              <span className="flex items-center gap-2">
                <i className="size-2 rounded-full bg-accent" />
                Expenses
              </span>
            </div>
          </div>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={(sum?.series ?? []).slice(-months)}>
                <defs>
                  <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E7ECF2"
                />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v / 1000}k`}
                />
                <Tooltip formatter={(v) => money(Number(v))} />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  fill="url(#income)"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#16A36A"
                  strokeWidth={2.5}
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className="rounded-2xl bg-brand p-6 text-white shadow-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-mint">
                Cash-flow outlook
              </p>
              <h2 className="mt-2 text-xl font-bold">Next 30 days</h2>
            </div>
            <span className="rounded-full bg-accent/20 px-2.5 py-1 text-xs font-bold text-mint">
              {sum && sum.cash.projected >= sum.cash.opening ? "Positive" : "Review"}
            </span>
          </div>
          <div className="mt-7">
            <p className="text-xs text-white/50">Projected closing cash</p>
            <p className="mt-1 text-3xl font-extrabold">{sum ? zar(sum.cash.projected) : "—"}</p>
            <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-mint">
              <ArrowUpRight className="size-3.5" /> {sum ? `${zar(Math.abs(sum.cash.projected - sum.cash.opening))} ${sum.cash.projected >= sum.cash.opening ? "increase" : "decrease"}` : ""}
            </p>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/[0.07] p-3">
              <p className="text-[11px] text-white/45">Expected inflows</p>
              <p className="mt-1 font-bold">{sum ? zar(sum.cash.inflows) : "—"}</p>
            </div>
            <div className="rounded-xl bg-white/[0.07] p-3">
              <p className="text-[11px] text-white/45">Expected outflows</p>
              <p className="mt-1 font-bold">{sum ? zar(sum.cash.outflows) : "—"}</p>
            </div>
          </div>
          <button onClick={() => navigate("/app/cash-flow")} className="mt-6 flex w-full items-center justify-between rounded-xl bg-white px-4 py-3 text-sm font-bold text-brand">
            View full forecast <ChevronRight className="size-4" />
          </button>
          <p className="mt-4 text-[10px] leading-4 text-white/35">
            Projected figures are estimates based on recorded invoices and
            assumptions.
          </p>
        </article>
      </section>
      <section className="mt-5 grid gap-5 xl:grid-cols-[1.65fr_1fr]">
        <article className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-line px-6 py-5">
            <div>
              <h2 className="font-bold">Recent transactions</h2>
              <p className="mt-1 text-xs text-muted">
                Latest recorded money movement
              </p>
            </div>
            <button onClick={() => navigate("/app/transactions")} className="text-sm font-bold text-brand-blue">
              View all
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="bg-canvas text-[11px] uppercase tracking-wider text-muted">
                <tr>
                  {["Description", "Category", "Date", "Status", "Amount"].map(
                    (x) => (
                      <th key={x} className="px-6 py-3 font-semibold">
                        {x}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.slice(0, 6).map((row, i) => (
                  <tr key={row[0] + i}>
                    <td className="px-6 py-4 font-semibold">{row[0]}</td>
                    <td className="px-6 py-4 text-muted">{row[1]}</td>
                    <td className="px-6 py-4 text-muted">{row[2]}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-blue-soft px-2.5 py-1 text-[11px] font-bold text-brand-blue">
                        {row[3]}
                      </span>
                    </td>
                    <td
                      className={`px-6 py-4 text-right font-bold ${
                        i % 2 === 0 ? "text-accent" : ""
                      }`}
                    >
                      {row[4]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && (
              <p className="px-6 py-8 text-center text-sm text-muted">
                {loadError || "No transactions yet. Use Add income or Add expense."}
              </p>
            )}
          </div>
        </article>
        <div className="space-y-5">
          <article className="rounded-2xl border border-line bg-white p-5 shadow-card">
            <h2 className="font-bold">Quick actions</h2>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                [Plus, "Add income", () => setModal("income")],
                [Receipt, "Add expense", () => setModal("expense")],
                [FileText, "New invoice", () => navigate("/app/invoices")],
              ].map(([Icon, label, run]) => {
                const I = Icon as typeof Plus
                return (
                  <button
                    key={label as string}
                    onClick={run as () => void}
                    className="flex flex-col items-start gap-3 rounded-xl border border-line p-3 text-left text-xs font-bold hover:border-brand-blue"
                  >
                    <I className="size-4 text-brand-blue" />
                    {label as string}
                  </button>
                )
              })}
            </div>
          </article>
          <article className="rounded-2xl border border-line bg-white p-5 shadow-card">
            <div className="flex justify-between">
              <h2 className="font-bold">Needs attention</h2>
              <span className="rounded-full bg-danger-soft px-2 text-xs font-bold text-danger">
                {sum ? (sum.attention.overdueInvoices ? 1 : 0) + (sum.attention.needReview ? 1 : 0) : 0}
              </span>
            </div>
            <div className="mt-4 space-y-4">
              {sum && sum.attention.overdueInvoices > 0 && (
                <button onClick={() => navigate("/app/invoices")} className="flex gap-3 text-left">
                  <Clock3 className="size-5 text-danger" />
                  <div>
                    <p className="text-xs font-bold">{sum.attention.overdueInvoices} invoice{sum.attention.overdueInvoices === 1 ? " is" : "s are"} overdue</p>
                    <p className="text-[11px] text-muted">{zar(sum.attention.overdueValue)} outstanding</p>
                  </div>
                </button>
              )}
              {sum && sum.attention.needReview > 0 && (
                <button onClick={() => navigate("/app/transactions")} className="flex gap-3 text-left">
                  <CircleAlert className="size-5 text-warning" />
                  <div>
                    <p className="text-xs font-bold">{sum.attention.needReview} transaction{sum.attention.needReview === 1 ? "" : "s"} awaiting review</p>
                    <p className="text-[11px] text-muted">Your accountant will check these</p>
                  </div>
                </button>
              )}
              {sum && !sum.attention.overdueInvoices && !sum.attention.needReview && (
                <p className="text-xs text-muted">Nothing needs attention. Well done.</p>
              )}
            </div>
          </article>
        </div>
      </section>
      {toast}
      {modal && (
        <FormModal
          title={actions[modal][0]}
          submitLabel="Save record"
          onClose={() => setModal(null)}
          onSubmit={addRow}
          fields={[
            { name: "description", label: "Description", placeholder: "e.g. Catering deposit" },
            { name: "category", label: "Category", type: "select", options: [...actions[modal][1]] },
            { name: "amount", label: "Amount (ZAR)", type: "number", placeholder: "0.00" },
          ]}
        />
      )}
    </AppShell>
  )
}
