// hooks/useSystemSetting.ts
import { useQuery } from '@tanstack/react-query'

function toBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v
  if (v == null) return false
  const s = String(v).trim().toLowerCase()
  return s === '1' || s === 'true' || s === 'enabled' || s === 'on' || s === 'yes'
}

type AnyRec = Record<string, unknown>

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL // ör: http://localhost:5014
  ?? process.env.NEXT_PUBLIC_API_URL
  ?? ''

export function useSystemSetting(key: string) {
  const wanted = key.toLowerCase()

  return useQuery({
    queryKey: ['system-settings', wanted],
    queryFn: async () => {
      // Doğru yol + olası varyantlar (mutlaka PascalCase’i ekledik)
      const paths = [
        '/api/SystemSettings',     // ✔ swagger’da çalışan yol
        '/api/systemsettings',
        '/api/system-settings',
        '/api/settings',
      ]

      // Base URL’li ve relatife karşı dene
      const urls: string[] = []
      for (const p of paths) {
        if (API_BASE) urls.push(`${API_BASE}${p}`)
        urls.push(p)
      }

      let lastErr: any = null
      for (const url of urls) {
        try {
          const res = await fetch(url, {
            credentials: 'include',
            headers: { accept: 'application/json' },
          })
          if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`)
          const body = await res.json()
          return { url, body }
        } catch (e) {
          lastErr = e
        }
      }
      throw lastErr ?? new Error('No system settings endpoint responded')
    },
    select: (resp: { url: string; body: unknown }) => {
      const body = resp.body

      // Dizi: [{ key:'coupon_system', value:'1' }, ...]
      if (Array.isArray(body)) {
        for (const item of body as AnyRec[]) {
          const k = (item.key ?? item.Key ?? item.name ?? item.Name ?? item.azKey ?? item.AzKey) as string | undefined
          if (k && k.toLowerCase() === wanted) {
            const raw = item.value ?? (item as any).Value ?? null
            return { valueRaw: raw, valueBool: toBool(raw), sourceUrl: resp.url }
          }
        }
        return { valueRaw: null, valueBool: false, sourceUrl: resp.url }
      }

      // Sözlük: { coupon_system: "1", ... } ya da tek kayıt: { key:'coupon_system', value:'1' }
      if (body && typeof body === 'object') {
        const map = body as AnyRec
        for (const k of Object.keys(map)) {
          if (k.toLowerCase() === wanted) {
            const raw = map[k]
            return { valueRaw: raw, valueBool: toBool(raw), sourceUrl: resp.url }
          }
        }
        const k = (map['key'] ?? map['Key']) as string | undefined
        if (k && k.toLowerCase() === wanted) {
          const raw = map['value'] ?? (map as any)['Value'] ?? null
          return { valueRaw: raw, valueBool: toBool(raw), sourceUrl: resp.url }
        }
      }

      return { valueRaw: null, valueBool: false, sourceUrl: resp.url }
    },
    staleTime: 0,
  })
}
