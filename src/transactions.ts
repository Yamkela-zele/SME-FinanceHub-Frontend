import { api } from "./api"

export type ApiTransaction = {
  id: string
  type: "INCOME" | "EXPENSE"
  description: string
  category: string
  amount: number
  date: string
  reviewed: boolean
}

export const listTransactions = () =>
  api<{ data: ApiTransaction[] }>("/transactions").then((r) => r.data)

export const createTransaction = (body: {
  type: "INCOME" | "EXPENSE"
  description: string
  category: string
  amount: number
}) => api<{ data: ApiTransaction }>("/transactions", { method: "POST", body }).then((r) => r.data)

const rand = (n: number) => `R ${n.toLocaleString("en-ZA", { maximumFractionDigits: 2 })}`
const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", timeZone: "UTC" })
const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
const sign = (t: ApiTransaction) => `${t.type === "INCOME" ? "+" : "−"} ${rand(t.amount)}`
const status = (t: ApiTransaction) => (t.reviewed ? "Reconciled" : "Recorded")

/** Dashboard: Description, Category, Date, Status, Amount */
export const dashboardRow = (t: ApiTransaction) => [t.description, t.category, shortDate(t.date), status(t), sign(t)]
/** Transactions page: Description, Category, Date, Status, Amount */
export const transactionsRow = (t: ApiTransaction) => [t.description, t.category, longDate(t.date), status(t), sign(t)]
/** Income page: Description, Type, Category, Date, Amount */
export const incomeRow = (t: ApiTransaction) => [
  t.description,
  t.type === "INCOME" ? "Income" : "Expense",
  t.category,
  longDate(t.date),
  sign(t),
]
