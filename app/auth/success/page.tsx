'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import { Box, CircularProgress, Typography } from '@mui/material'

function AuthSuccessPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setToken, initialize } = useAuthStore()

  useEffect(() => {
    const handleAuthSuccess = async () => {
      const token = searchParams.get('token')

      if (token) {
        setToken(token)
        await initialize()
        router.push('/dashboard')
      } else {
        router.push('/login?error=no_token')
      }
    }

    handleAuthSuccess()
  }, [searchParams, setToken, initialize, router])

  return (
    <Box className="loading-container">
      <Box sx={{ textAlign: 'center' }}>
        <CircularProgress color="primary" size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Completing authentication...
        </Typography>
      </Box>
    </Box>
  )
}

export default function AuthSuccessPage() {
  return (
    <Suspense fallback={<div className="loading-container">Loading...</div>}>
      <AuthSuccessPageContent />
    </Suspense>
  )
}