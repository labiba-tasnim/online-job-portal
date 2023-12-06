import { useEffect, useState } from "react";
import { Grid, Box, TextField, Button, Avatar } from "@material-ui/core";
import apiList from "../lib/apiList";
import axios from "axios";

function Connections(props) {
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults]  = useState(undefined);
  const [connections, setConnections] = useState(undefined);

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleSearch = async () => {
    setSearchResults([]);
    const params = {
      query: searchInput
    }
    const headers = {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    }
    const response = await axios.get(apiList.userSearch, { params, headers }).then(resp => resp.data.results);
    if (!response.length) {
      return setSearchResults(null)
    }
    setSearchResults(response.map(res => ({ ...res, added: false })));
    console.log(response);
  }

  const handleConnectionAdd = async (conn) => {
    const headers = {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    };
    await axios.post(`${apiList.connection}/${conn._id}`, undefined, { headers });
    let updatedSearchResults = searchResults.map(result => {
      if (result._id === conn._id) {
        result.added = true;
      }
      return result;
    });
    setSearchResults(updatedSearchResults);
    fetchConnections();
  };

  const handleConnectionRemove = async (conn) => {
    const headers = {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    };
    await axios.delete(`${apiList.connection}/${conn.user._id}`, { headers });
    fetchConnections();
  }

  const fetchConnections = async () => {
    const headers = {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    };
    const response = await axios.get(apiList.connection, { headers }).then(resp => resp.data);
    if (!response.length) {
      return setConnections(null);
    } 
    setConnections(response);
  };

  const renderSearchResults = () => {
    if (searchResults === null) {
      return <div>No results found</div>
    }

    if (searchResults === undefined) {
      return null;
    }

    return searchResults.map(result => 
      <Box key={result._id} display='flex' alignItems='center' justifyContent='space-between' flexDirection='row' margin='8px 0'>
        <Box display='flex' flexDirection='row'>
          <Avatar alt={result.name} style={{ marginRight: '10px', width: 34, height: 34 }} />
          <div>{result.name}</div>
        </Box>
        <Button variant='contained' disabled={result.added} size="small" style={{ marginLeft: 10 }} onClick={() => handleConnectionAdd(result)}>{result.added ? 'Added' : 'Add'}</Button>
      </Box>
    );
  }

  const renderConnections = () => {
    if (connections === null) {
      return <div>No connections found</div>
    }

    if (connections === undefined) {
      return null;
    }

    return connections.map(result => 
      <Box key={result.user._id} display='flex' alignItems='center' justifyContent='space-between' flexDirection='row' margin='8px 0'>
        <Box display='flex' flexDirection='row'>
          <Avatar alt={result[result.user.type].name} style={{ marginRight: '10px', width: 34, height: 34 }} />
          <div>{result[result.user.type].name}</div>
        </Box>
        <Button variant='contained' disabled={result.added} size="small" style={{ marginLeft: 10, backgroundColor: 'orange', color: 'black' }} onClick={() => handleConnectionRemove(result)}>Remove</Button>
      </Box>
    );
  }

  return (
      <Grid item container direction="row" style={{ width: '50%', display: 'flex', justifyContent: 'space-around'  }}>
        <Box>
          <h1>Search User</h1>
          <Box display='flex' flexDirection='row' alignItems='center'>
            <TextField label='Search' variant="outlined" value={searchInput} onChange={e => setSearchInput(e.target.value)} />
            <Button style={{ marginLeft: '3px', backgroundColor: 'teal', color: 'white' }} variant="contained" onClick={handleSearch}>Search</Button>
          </Box>
          
          <Box display='flex' flexDirection='column' margin='10px 0'>
            {renderSearchResults()}
          </Box>
        </Box>
        <Box>
          <h1>My Connections</h1>
          {renderConnections()}
        </Box>
      </Grid>
  )
}

export default Connections;
