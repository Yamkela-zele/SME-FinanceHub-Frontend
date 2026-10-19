import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { CheckCircle2, X } from "lucide-react"

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])
  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-ink/50 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-extrabold tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-muted hover:bg-canvas"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function useToast() {
  const [message, setMessage] = useState("")
  const timer = useRef<number>(undefined)
  const show = useCallback((text: string) => {
    setMessage(text)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setMessage(""), 3500)
  }, [])
  const toast = message ? (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-xl"
    >
      <CheckCircle2 className="size-4 text-mint" /> {message}
    </div>
  ) : null
  return [toast, show] as const
}

export type Field = {
  name: string
  label: string
  type?: "text" | "number" | "date" | "email" | "select"
  options?: string[]
  placeholder?: string
}

export function FormModal({
  title,
  fields,
  submitLabel,
  onClose,
  onSubmit,
}: {
  title: string
  fields: Field[]
  submitLabel: string
  onClose: () => void
  onSubmit: (values: Record<string, string>) => void
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      fields.map((f) => [
        f.name,
        f.type === "select" ? (f.options?.[0] ?? "") : "",
      ]),
    ),
  )
  return (
    <Modal title={title} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit(values)
        }}
        className="space-y-4"
      >
        {fields.map((f) => (
          <label key={f.name} className="block">
            <span className="form-label">{f.label}</span>
            {f.type === "select" ? (
              <select
                className="form-input"
                value={values[f.name]}
                onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
              >
                {f.options?.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            ) : (
              <input
                required
                type={f.type ?? "text"}
                min={f.type === "number" ? 0 : undefined}
                step={f.type === "number" ? "0.01" : undefined}
                className="form-input"
                placeholder={f.placeholder}
                value={values[f.name]}
                onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
              />
            )}
          </label>
        ))}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold"
          >
            Cancel
          </button>
          <button className="rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white">
            {submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function downloadCsv(filename: string, head: string[], rows: string[][]) {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
  const csv = [head, ...rows].map((r) => r.map(esc).join(",")).join("\n")
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
