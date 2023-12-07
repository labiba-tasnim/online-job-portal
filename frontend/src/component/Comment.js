import React, { useState, useEffect } from 'react';
import { Button, TextField, Typography, Paper, List, ListItem, Avatar } from '@material-ui/core';
import { makeStyles } from '@material-ui/core';
import axios from 'axios';

const useStyles = makeStyles((theme) => ({
  commentContainer: {
    margin: theme.spacing(2),
    padding: theme.spacing(2),
  },
  commentList: {
    marginTop: theme.spacing(2),
  },
}));

function Comment({ applicationId }) {
  const classes = useStyles();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  const fetchComments = async () => {
    try {
      const response = await axios.get(`/applications/${applicationId}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [applicationId]);

  const handleCommentSubmit = async () => {
    try {
      const response = await axios.post(`/applications/${applicationId}/comments`, {
        text: newComment,
      });
      setComments(response.data);
      setNewComment('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  return (
    <Paper className={classes.commentContainer}>
      <Typography variant="h6">Comments</Typography>
      <TextField
        label="Add a comment"
        multiline
        rows={4}
        fullWidth
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
      />
      <Button variant="contained" color="primary" onClick={handleCommentSubmit}>
        Add Comment
      </Button>
      <List className={classes.commentList}>
        {comments.map((comment) => (
          <ListItem key={comment._id}>
            <Avatar>{comment.userId.name[0]}</Avatar>
            <Typography>{comment.userId.name}: {comment.text}</Typography>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}

export default Comment;
