import React, { useState } from "react";
import axios from "axios";
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  Button,
  Snackbar,
} from "@material-ui/core";
import MuiAlert from "@material-ui/lab/Alert";

const Alert = (props) => {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
};

const PostResources = () => {
  const [data, setData] = useState({
    resourceName: "",
    resourceDomain: "",
    resourceDescription: "",
  });
  const [error, setError] = useState("");
  const [isSnackbarOpen, setIsSnackbarOpen] = useState(false);

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleCloseSnackbar = () => {
    setIsSnackbarOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      const url = "http://localhost:4444/api/resources";
      const { data: res } = await axios.post(url, data, config);

      setIsSnackbarOpen(true);
    } catch (error) {
      if (
        error.response &&
        error.response.status >= 400 &&
        error.response.status <= 500
      ) {
        setError(error.response.data.message);
      }
    }
  };

  return (
    <>
      <div className="flex flex-col min-h-screen bg-gray-100">
        <main className="flex pt-20 items-center justify-center rounded-lg ">
          <Container maxWidth="sm">
            <Paper elevation={3} style={{ padding: 16 }}>
              <Typography variant="h6" gutterBottom>
                Post a New Resource for Your Peers
              </Typography>

              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Title of the Resource"
                  variant="outlined"
                  margin="normal"
                  name="resourceName"
                  value={data.resourceName}
                  onChange={handleChange}
                  required
                />

                <Select
                  fullWidth
                  label="Resource Domain"
                  variant="outlined"
                  margin="normal"
                  name="resourceDomain"
                  value={data.resourceDomain}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="Select">Select</MenuItem>
                {/*<MenuItem value="Computer Science and Engineering">
                    Computer Science and Engineering
                  </MenuItem>
                  <MenuItem value="Electrical and Electronics Engineering">
                    Electrical and Electronics Engineering
                  </MenuItem>
                  <MenuItem value="Mechanical Engineering">
                    Mechanical Engineering
                  </MenuItem>
                  <MenuItem value="Civil Engineering">Civil Engineering</MenuItem>
                  <MenuItem value="Business and Management">
                    Business and Management
                  </MenuItem>
  <MenuItem value="Others">Others</MenuItem>*/}
                </Select>

                <TextField
                  fullWidth
                  label="Provide Description of the Resource"
                  variant="outlined"
                  margin="normal"
                  name="resourceDescription"
                  value={data.resourceDescription}
                  onChange={handleChange}
                  multiline
                  rows={4}
                  required
                />

                {error && (
                  <Typography color="error" gutterBottom>
                    {error}!
                  </Typography>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  style={{ marginTop: 16 }}
                >
                  Post Resource
                </Button>
              </form>
            </Paper>
          </Container>

          <Snackbar
            open={isSnackbarOpen}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
          >
            <Alert onClose={handleCloseSnackbar} severity="success">
              Resource Posted Successfully.
            </Alert>
          </Snackbar>
        </main>
      </div>
    </>
  );
};

export default PostResources;
