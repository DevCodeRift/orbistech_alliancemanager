import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
  Alert,
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');

  const handleDiscordLogin = () => {
    // Redirect to Discord OAuth endpoint
    window.location.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/auth/discord`;
  };

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'auth_failed':
        return 'Authentication failed. Please try again.';
      case 'server_error':
        return 'Server error occurred. Please try again later.';
      default:
        return null;
    }
  };

  const errorMessage = getErrorMessage(error);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Card
          sx={{
            p: 4,
            textAlign: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <CardContent>
            <Typography
              variant="h3"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
              }}
            >
              Politics & War
            </Typography>
            <Typography
              variant="h5"
              component="h2"
              gutterBottom
              sx={{ color: 'rgba(255, 255, 255, 0.9)', mb: 3 }}
            >
              Alliance Manager
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                mb: 4,
                lineHeight: 1.6,
              }}
            >
              Manage your alliance with powerful tools for member tracking,
              banking operations, war coordination, and trade analysis.
            </Typography>

            {errorMessage && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {errorMessage}
              </Alert>
            )}

            <Button
              variant="contained"
              size="large"
              onClick={handleDiscordLogin}
              sx={{
                py: 1.5,
                px: 4,
                fontSize: '1.1rem',
                background: 'linear-gradient(45deg, #5865F2 30%, #4752C4 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #4752C4 30%, #3C45A5 90%)',
                },
                borderRadius: 2,
              }}
            >
              Login with Discord
            </Button>

            <Typography
              variant="caption"
              display="block"
              sx={{
                color: 'rgba(255, 255, 255, 0.5)',
                mt: 3,
                lineHeight: 1.4,
              }}
            >
              By logging in, you agree to link your Discord account
              and optionally your Politics & War nation for alliance management.
            </Typography>
          </CardContent>
        </Card>

        {/* Features section */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography
            variant="h6"
            sx={{ color: 'rgba(255, 255, 255, 0.9)', mb: 2 }}
          >
            Features
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 2,
            }}
          >
            <Card
              sx={{
                p: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Typography variant="subtitle2" sx={{ color: '#FE6B8B', mb: 1 }}>
                Member Management
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Track alliance members, activity, and performance metrics
              </Typography>
            </Card>

            <Card
              sx={{
                p: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Typography variant="subtitle2" sx={{ color: '#FF8E53', mb: 1 }}>
                Banking Operations
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Manage alliance funds, grants, and resource distribution
              </Typography>
            </Card>

            <Card
              sx={{
                p: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Typography variant="subtitle2" sx={{ color: '#5865F2', mb: 1 }}>
                War Coordination
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Track conflicts, coordinate attacks, and monitor progress
              </Typography>
            </Card>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginPage;