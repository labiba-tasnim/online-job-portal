import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Container,
  Grid,
  Paper,
  Typography,
  Select,
  MenuItem,
  Button,
} from "@material-ui/core";

const Resources = () => {
  const [resources, setResources] = useState([]);
  const [currentUser, setCurrentUser] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState("");
  const [filteredResources, setFilteredResources] = useState([]);
  const [showMore, setShowMore] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const config = {
          headers: { Authorization: `Bearer ${token}` },
        };

        const resourcesResponse = await axios.get(
          "http://localhost:4444/api/resources",
          config
        );

        const currentUserResponse = await axios.get(
          "http://localhost:4444/api/getcurrentuser",
          config
        );

        setResources(resourcesResponse.data);
        setFilteredResources(resourcesResponse.data);
        setCurrentUser(currentUserResponse.data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();
  }, []);

  const formatDate = (date) => {
    const options = {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    };

    return new Date(date).toLocaleString("en-GB", options);
  };

  const handleShowMoreToggle = (resourceId) => {
    setShowMore((prevState) => ({
      ...prevState,
      [resourceId]: !prevState[resourceId],
    }));
  };

  const handleDomainFilterChange = (e) => {
    setSelectedDomain(e.target.value);
  };

  const handleSearch = () => {
    if (selectedDomain !== "") {
      const filtered = resources.filter(
        (resource) => resource.resourceDomain === selectedDomain
      );
      setFilteredResources(filtered);
    } else {
      setFilteredResources(resources);
    }
  };

  return (
    <>
      <main>
        <Container>
          <Grid container spacing={12}>
            {/*<Grid item xs={12} md={4}>
              <Paper elevation={3} style={{ padding: 16 }}>
                <Typography variant="h6" gutterBottom>
                  Filter by Domain:
                </Typography>
                <Select
                  value={selectedDomain}
                  onChange={handleDomainFilterChange}
                  variant="outlined"
                  fullWidth
                >
                  <MenuItem value="">All Domains</MenuItem>
                  <MenuItem value="Computer Science and Engineering">
                    Computer Science and Engineering
                  </MenuItem>
                  <MenuItem value="Electrical and Electronics Engineering">
                    Electrical and Electronics Engineering
                  </MenuItem>
                  <MenuItem value="Civil Engineering">Civil Engineering</MenuItem>
                  <MenuItem value="Mechanical Engineering">
                    Mechanical Engineering
                  </MenuItem>
                  <MenuItem value="Business and Management">
                    Business and Management
                  </MenuItem>
                  <MenuItem value="Others">Others</MenuItem>
                </Select>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSearch}
                  fullWidth
                  style={{ marginTop: 16 }}
                >
                  Search
                </Button>
              </Paper>
  </Grid>*/}
            {/*<Grid item xs={12} md={8}>*/}
              {filteredResources.length > 0 ? (
                filteredResources.map((resource) => (
                  <Paper
                    key={resource._id}
                    elevation={3}
                    style={{ padding: 16, marginBottom: 16 }}
                  >
                    <Typography variant="subtitle1" color="primary">
                      {resource.userName} - Posted at {formatDate(resource.datePosted)}
                    </Typography>
                    <Typography variant="h6" gutterBottom>
                      {resource.resourceName}
                    </Typography>
                    <div style={{ marginBottom: 8 }}>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        component="div"
                      >
                        {resource.resourceDomain}
                      </Typography>
                    </div>
                    <Typography
                      variant="body1"
                      color="textPrimary"
                      paragraph={!showMore[resource._id]}
                    >
                      {resource.resourceDescription}
                    </Typography>
                    {resource.resourceDescription.length > 120 && (
                      <Button
                        color="primary"
                        onClick={() => handleShowMoreToggle(resource._id)}
                      >
                        {showMore[resource._id] ? "Show Less" : "Show More"}
                      </Button>
                    )}
                  </Paper>
                ))
              ) : (
                <Paper elevation={3} style={{ padding: 16, marginTop: 16 }}>
                  <Typography variant="subtitle1" color="error">
                    No Resources Available
                  </Typography>
                </Paper>
              )}
            {/*</Grid>*/}
          </Grid>
        </Container>
      </main>
    </>
  );
};

export default Resources;
