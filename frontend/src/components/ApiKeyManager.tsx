import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  CircularProgress,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { api } from '../store/authStore';

interface ApiKeyStatus {
  personalApiKey: {
    isLinked: boolean;
    nationId?: number;
    nationName?: string;
    maskedKey?: string;
    usage?: {
      used: number;
      max: number;
      percentage: number;
      isNearLimit: boolean;
    };
    error?: string;
  };
  allianceApiKeys: Array<{
    allianceName: string;
    allianceSlug: string;
    isLinked: boolean;
    maskedKey?: string;
    usage?: {
      used: number;
      max: number;
      percentage: number;
      isNearLimit: boolean;
    };
    error?: string;
  }>;
}

interface ValidationResult {
  isValid: boolean;
  nation?: {
    id: number;
    name: string;
    allianceId?: number;
    allianceName?: string;
  };
  permissions?: {
    canViewNationData: boolean;
    canViewNationResources: boolean;
    canViewAllianceData: boolean;
    canViewAllianceBank: boolean;
    canManageAllianceBank: boolean;
    dailyRequests: number;
    isVip: boolean;
  };
  usage?: {
    used: number;
    max: number;
  };
}

const ApiKeyManager: React.FC = () => {
  const [status, setStatus] = useState<ApiKeyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [keyType, setKeyType] = useState<'personal' | 'alliance'>('personal');
  const [selectedAlliance, setSelectedAlliance] = useState('');
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    fetchApiKeyStatus();
  }, []);

  const fetchApiKeyStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api-keys/status');
      setStatus(response.data);
      setError(null);
    } catch (error: any) {
      console.error('Failed to fetch API key status:', error);
      setError(error.response?.data?.error || 'Failed to load API key status');
    } finally {
      setLoading(false);
    }
  };

  const validateApiKey = async () => {
    if (!apiKeyInput.trim()) return;

    try {
      setValidating(true);
      const response = await api.post('/api-keys/validate', {
        apiKey: apiKeyInput.trim(),
      });
      setValidation(response.data.validation);
    } catch (error: any) {
      console.error('API key validation failed:', error);
      setValidation({
        isValid: false,
        error: error.response?.data?.details || 'Validation failed',
      });
    } finally {
      setValidating(false);
    }
  };

  const linkApiKey = async () => {
    if (!validation?.isValid) return;

    try {
      setLinking(true);
      const payload: any = {
        apiKey: apiKeyInput.trim(),
        keyType,
      };

      if (keyType === 'alliance') {
        payload.allianceSlug = selectedAlliance;
      }

      await api.post('/api-keys/link', payload);

      // Reset form and refresh status
      setAddDialogOpen(false);
      setApiKeyInput('');
      setValidation(null);
      await fetchApiKeyStatus();
    } catch (error: any) {
      console.error('Failed to link API key:', error);
      setError(error.response?.data?.error || 'Failed to link API key');
    } finally {
      setLinking(false);
    }
  };

  const removeApiKey = async (type: 'personal' | string) => {
    try {
      if (type === 'personal') {
        await api.delete('/api-keys/personal');
      } else {
        await api.delete(`/api-keys/alliance/${type}`);
      }
      await fetchApiKeyStatus();
    } catch (error: any) {
      console.error('Failed to remove API key:', error);
      setError(error.response?.data?.error || 'Failed to remove API key');
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 80) return 'error';
    if (percentage >= 60) return 'warning';
    return 'primary';
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <CircularProgress size={24} />
            <Typography>Loading API key status...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Personal API Key Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Personal API Key</Typography>
            {!status?.personalApiKey.isLinked && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setKeyType('personal');
                  setAddDialogOpen(true);
                }}
              >
                Link API Key
              </Button>
            )}
          </Box>

          {status?.personalApiKey.isLinked ? (
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <CheckCircleIcon color="success" />
                <Typography variant="body1">
                  Linked to: <strong>{status.personalApiKey.nationName}</strong>
                </Typography>
              </Box>

              {status.personalApiKey.maskedKey && (
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Key: {status.personalApiKey.maskedKey}
                </Typography>
              )}

              {status.personalApiKey.usage && (
                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">
                      API Usage: {status.personalApiKey.usage.used} / {status.personalApiKey.usage.max}
                    </Typography>
                    <Typography variant="body2">
                      {status.personalApiKey.usage.percentage.toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={status.personalApiKey.usage.percentage}
                    color={getUsageColor(status.personalApiKey.usage.percentage)}
                  />
                  {status.personalApiKey.usage.isNearLimit && (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                      <WarningIcon /> API usage is near the daily limit
                    </Alert>
                  )}
                </Box>
              )}

              {status.personalApiKey.error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {status.personalApiKey.error}
                </Alert>
              )}

              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => removeApiKey('personal')}
              >
                Remove API Key
              </Button>
            </Box>
          ) : (
            <Alert severity="info">
              Link your Politics & War API key to access nation data and enable alliance management features.
              You can find your API key at: https://politicsandwar.com/account/#7
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Alliance API Keys Section */}
      {status?.allianceApiKeys && status.allianceApiKeys.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" mb={2}>Alliance API Keys</Typography>

            <List>
              {status.allianceApiKeys.map((alliance, index) => (
                <React.Fragment key={alliance.allianceSlug}>
                  <ListItem>
                    <ListItemText
                      primary={alliance.allianceName}
                      secondary={
                        <Box>
                          {alliance.isLinked ? (
                            <Box>
                              <Box display="flex" alignItems="center" gap={1} mb={1}>
                                <CheckCircleIcon color="success" fontSize="small" />
                                <Typography variant="body2">
                                  Linked {alliance.maskedKey && `(${alliance.maskedKey})`}
                                </Typography>
                              </Box>

                              {alliance.usage && (
                                <Box>
                                  <Typography variant="caption">
                                    Usage: {alliance.usage.used} / {alliance.usage.max} ({alliance.usage.percentage.toFixed(1)}%)
                                  </Typography>
                                  <LinearProgress
                                    variant="determinate"
                                    value={alliance.usage.percentage}
                                    color={getUsageColor(alliance.usage.percentage)}
                                    sx={{ mt: 0.5, height: 4 }}
                                  />
                                </Box>
                              )}

                              {alliance.error && (
                                <Alert severity="error" sx={{ mt: 1 }}>
                                  {alliance.error}
                                </Alert>
                              )}
                            </Box>
                          ) : (
                            <Box display="flex" alignItems="center" gap={1}>
                              <ErrorIcon color="error" fontSize="small" />
                              <Typography variant="body2">Not linked</Typography>
                            </Box>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      {alliance.isLinked ? (
                        <IconButton
                          edge="end"
                          onClick={() => removeApiKey(alliance.allianceSlug)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      ) : (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            setKeyType('alliance');
                            setSelectedAlliance(alliance.allianceSlug);
                            setAddDialogOpen(true);
                          }}
                        >
                          Link Key
                        </Button>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < status.allianceApiKeys.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Add API Key Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Link {keyType === 'personal' ? 'Personal' : 'Alliance'} API Key
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Politics & War API Key"
            value={apiKeyInput}
            onChange={(e) => {
              setApiKeyInput(e.target.value);
              setValidation(null);
            }}
            margin="normal"
            helperText="You can find your API key at https://politicsandwar.com/account/#7"
          />

          {apiKeyInput && (
            <Box mt={2}>
              <Button
                variant="outlined"
                onClick={validateApiKey}
                disabled={validating}
                startIcon={validating ? <CircularProgress size={16} /> : <VisibilityIcon />}
              >
                {validating ? 'Validating...' : 'Validate API Key'}
              </Button>
            </Box>
          )}

          {validation && (
            <Box mt={2}>
              {validation.isValid ? (
                <Alert severity="success">
                  <Typography variant="subtitle2">API Key Valid!</Typography>
                  <Typography variant="body2">
                    Nation: {validation.nation?.name} (ID: {validation.nation?.id})
                  </Typography>
                  {validation.nation?.allianceName && (
                    <Typography variant="body2">
                      Alliance: {validation.nation.allianceName}
                    </Typography>
                  )}
                  {validation.permissions && (
                    <Box mt={1}>
                      <Typography variant="body2">Permissions:</Typography>
                      <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                        {validation.permissions.canViewNationResources && (
                          <Chip label="Nation Resources" size="small" color="primary" />
                        )}
                        {validation.permissions.canViewAllianceBank && (
                          <Chip label="Alliance Bank" size="small" color="primary" />
                        )}
                        {validation.permissions.canManageAllianceBank && (
                          <Chip label="Bank Management" size="small" color="secondary" />
                        )}
                        {validation.permissions.isVip && (
                          <Chip label="VIP" size="small" color="warning" />
                        )}
                      </Box>
                    </Box>
                  )}
                </Alert>
              ) : (
                <Alert severity="error">
                  API Key validation failed: {validation.error || 'Invalid key'}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={linkApiKey}
            disabled={!validation?.isValid || linking}
            startIcon={linking ? <CircularProgress size={16} /> : undefined}
          >
            {linking ? 'Linking...' : 'Link API Key'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApiKeyManager;