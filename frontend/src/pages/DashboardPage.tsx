import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
} from '@mui/material';
import { useAuthStore } from '../store/authStore';
import ApiKeyManager from '../components/ApiKeyManager';

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome back, {user?.discordUsername}!
      </Typography>

      <Grid container spacing={3}>
        {/* User Info Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Your Account
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Discord: {user?.discordTag}
              </Typography>
              {user?.pnwNationName && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Nation: {user.pnwNationName}
                </Typography>
              )}
              {user?.systemAdmin && (
                <Chip
                  label={`System ${user.systemAdmin.level}`}
                  color="primary"
                  size="small"
                  sx={{ mt: 1 }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Alliance Managers Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Your Alliances
              </Typography>
              {user?.allianceManagers.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  You are not managing any alliances yet.
                </Typography>
              ) : (
                user?.allianceManagers.map((manager) => (
                  <Box key={manager.id} sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      {manager.alliance.allianceName}
                    </Typography>
                    <Chip
                      label={manager.role}
                      size="small"
                      color="secondary"
                      sx={{ ml: 1 }}
                    />
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* API Key Management */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
            API Key Management
          </Typography>
          <ApiKeyManager />
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Alliance management features will be available here once you're assigned as an alliance manager.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;