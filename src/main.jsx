import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Amplify } from 'aws-amplify'
import App from './App.jsx'
import './index.css'

// ⭐ Configure AWS Amplify
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
      region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
    }
  }
})

// Verify configuration (Development only)
if (import.meta.env.DEV) {
  console.log('🔐 Amplify Auth Configuration:', {
    region: import.meta.env.VITE_AWS_REGION,
    userPoolId: import.meta.env.VITE_USER_POOL_ID,
    clientId: import.meta.env.VITE_USER_POOL_CLIENT_ID ? '✅ Set' : '❌ Missing'
  })
}

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,        // 30 seconds - data considered fresh
      cacheTime: 300000,       // 5 minutes - cache lifetime
      retry: 1,                // Retry failed requests once
      refetchOnWindowFocus: false, // Don't refetch on window focus
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)