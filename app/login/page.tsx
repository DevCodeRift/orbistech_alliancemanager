'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material'

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isLoading } = useAuthStore()
  const [error, setError] = useState('')

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/dashboard')
    }

    const errorParam = searchParams.get('error')
    if (errorParam) {
      switch (errorParam) {
        case 'no_code':
          setError('Authorization code not received from Discord')
          break
        case 'registration_disabled':
          setError('User registration is currently disabled')
          break
        case 'server_error':
          setError('An error occurred during authentication')
          break
        default:
          setError('An unknown error occurred')
      }
    }
  }, [isAuthenticated, isLoading, router, searchParams])

  const handleDiscordLogin = () => {
    window.location.href = '/api/auth/discord'
  }

  if (isLoading) {
    return (
      <Box className="loading-container">
        <CircularProgress color="primary" />
      </Box>
    )
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Card sx={{ width: '100%', maxWidth: 400 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography component="h1" variant="h4" gutterBottom>
                Alliance Manager
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Politics and War Alliance Management System
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleDiscordLogin}
              sx={{
                mt: 2,
                mb: 2,
                backgroundColor: '#5865F2',
                '&:hover': {
                  backgroundColor: '#4752C4',
                },
              }}
            >
              Login with Discord
            </Button>

            <Typography variant="body2" color="text.secondary" align="center">
              Sign in with your Discord account to access alliance management tools
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="loading-container">Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  )
}