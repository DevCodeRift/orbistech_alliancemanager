import React from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
} from '@mui/material';

const AlliancePage: React.FC = () => {
  const { allianceSlug } = useParams<{ allianceSlug: string }>();

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Alliance: {allianceSlug}
      </Typography>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Alliance Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Alliance-specific management features will be implemented here.
            This will include member management, banking, war tracking, and more.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AlliancePage;