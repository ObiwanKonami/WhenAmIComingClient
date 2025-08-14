'use client' 

import ReactQueryProvider from '@/providers/react-query-provider' 

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReactQueryProvider>
        {children}
    </ReactQueryProvider>
  )
}