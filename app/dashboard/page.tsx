'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/stores/authStore'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  AppBar,
  Toolbar,
  Avatar,
  Menu,
  MenuItem,
  IconButton
} from '@mui/material'
import { AccountCircle, ExitToApp } from '@mui/icons-material'

export default function DashboardPage() {
  const { user, logout, isLoading } = useAuthStore()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    logout()
    handleClose()
  }

  if (isLoading) {
    return <Box className="loading-container">Loading...</Box>
  }

  if (!user) {
    return <Box className="loading-container">Not authenticated</Box>
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Alliance Manager
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ mr: 2 }}>
              {user.discordUsername}
            </Typography>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <Avatar
                src={user.discordAvatar}
                sx={{ width: 32, height: 32 }}
              >
                <AccountCircle />
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={handleLogout}>
                <ExitToApp sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Welcome, {user.discordUsername}!
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Discord ID: {user.discordId}
                </Typography>
                {user.pnwNationName && (
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Nation: {user.pnwNationName}
                  </Typography>
                )}
                {user.isSystemAdmin && (
                  <Typography variant="body2" color="primary" paragraph>
                    System Administrator
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Alliance Management
                </Typography>
                {user.allianceManagers && user.allianceManagers.length > 0 ? (
                  user.allianceManagers.map((manager) => (
                    <Box key={manager.id} sx={{ mb: 2 }}>
                      <Typography variant="body1">
                        {manager.allianceName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Role: {manager.role}
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        href={`/alliance/${manager.allianceSlug}`}
                        sx={{ mt: 1 }}
                      >
                        Manage Alliance
                      </Button>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No alliance management roles assigned
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {user.isSystemAdmin && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    System Administration
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    You have system administrator privileges
                  </Typography>
                  <Button variant="contained" href="/admin">
                    Admin Panel
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Container>
    </>
  )
}