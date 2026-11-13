// Earth OS — Root Layout
// Wraps the entire EARTH OS application with providers and shell

'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

// Create QueryClient outside render to prevent recreation
const queryClientSingleton = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

export default function EarthOsProviders({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <QueryClientProvider client={queryClientSingleton}>
      {children}
    </QueryClientProvider>
  )
}
