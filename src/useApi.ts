import { useCallback, useEffect, useState } from "react"
import { api } from "./api"

export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(!!path)
  const load = useCallback(async () => {
    if (!path) return
    try {
      setData(await api<T>(path))
      setError("")
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [path])
  useEffect(() => {
    void load()
  }, [load])
  return { data, setData, error, loading, reload: load }
}

export const zar = (n: number) =>
  `R ${Math.round(n).toLocaleString("en-ZA").replace(/\s/g, ",")}`
