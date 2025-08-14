// providers/react-query-provider.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools' 

export default function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Verilerin "eski" (stale) kabul edilip yeniden çekilmesi için varsayılan süre.
            staleTime: 0, // 5 dakika
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
     <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}