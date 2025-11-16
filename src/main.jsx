import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.jsx'
import './index.css'

// 🔑 ส่วนที่เพิ่ม: การกำหนดค่าและ Initialize AWS Amplify/Cognito
import { Amplify } from 'aws-amplify'

// 1. กำหนดค่า Configuration โดยดึงค่าจาก Environment Variables
const amplifyConfig = {
  Auth: {
    // ดึงค่า AWS Region, User Pool ID, และ Client ID ที่คุณเก็บไว้ใน GitHub Secrets
    region: import.meta.env.VITE_AWS_REGION,
    userPoolId: import.meta.env.VITE_USER_POOL_ID,
    userPoolWebClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
  },
  API: {
    endpoints: [
      {
        name: "MyApi",
        // ดึงค่า API Gateway URL
        endpoint: import.meta.env.VITE_API_BASE_URL,
        region: import.meta.env.VITE_AWS_REGION,
      },
      // ถ้ามี VITE_AI_API_URL ด้วย ก็ควรเพิ่มตรงนี้
      // {
      //   name: "AiApi",
      //   endpoint: import.meta.env.VITE_AI_API_URL,
      //   region: import.meta.env.VITE_AWS_REGION,
      // },
    ],
  },
};

// 2. สั่งให้ Amplify เริ่มต้นทำงานด้วยค่าที่กำหนด
Amplify.configure(amplifyConfig);
// ------------------------------------------------------------------


// Create a client (React Query Setup เดิมของคุณ)
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