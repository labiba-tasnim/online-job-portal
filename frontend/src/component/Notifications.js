import React from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
} from '@material-ui/core';

const Notifications = ({ notifications }) => {
  // Check if notifications is undefined or null
  if (!notifications || notifications.length === 0) {
    return (
      <Paper elevation={3} style={{ padding: '20px', margin: '20px' }}>
        <Typography variant="h5">Notifications</Typography>
        <Typography variant="body2">No notifications available.</Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} style={{ padding: '20px', margin: '20px' }}>
      <Typography variant="h5">Notifications</Typography>
      <List>
        {notifications.map((notification, index) => (
          <ListItem key={index}>
            <ListItemText primary={notification.message} secondary={notification.timestamp} />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default Notifications;
