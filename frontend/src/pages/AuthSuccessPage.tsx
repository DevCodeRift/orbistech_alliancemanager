import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { useAuthStore } from '../store/authStore';

const AuthSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setToken, fetchUser } = useAuthStore();

  useEffect(() => {
    const handleAuthSuccess = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        console.error('Auth error:', error);
        navigate('/login?error=' + error);
        return;
      }

      if (!token) {
        console.error('No token received');
        navigate('/login?error=no_token');
        return;
      }

      try {
        // Set the token in the store
        setToken(token);

        // Fetch user data
        await fetchUser();

        // Redirect to dashboard
        navigate('/dashboard', { replace: true });
      } catch (error) {
        console.error('Auth success handling error:', error);
        navigate('/login?error=auth_failed');
      }
    };

    handleAuthSuccess();
  }, [searchParams, navigate, setToken, fetchUser]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        color: 'white',
      }}
    >
      <CircularProgress
        size={60}
        sx={{
          color: '#FE6B8B',
          mb: 3,
        }}
      />

      <Typography
        variant="h5"
        component="h1"
        gutterBottom
        sx={{ textAlign: 'center' }}
      >
        Completing Login...
      </Typography>

      <Typography
        variant="body1"
        sx={{
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.7)',
          maxWidth: 400,
        }}
      >
        Please wait while we set up your account and load your alliance data.
      </Typography>
    </Box>
  );
};

export default AuthSuccessPage;