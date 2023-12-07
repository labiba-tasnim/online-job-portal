import React, { useState } from "react";
import {
    Button,
    Menu,
    MenuItem
 } from "@material-ui/core";
import { Link, useLocation } from "react-router-dom";

const LearnNGrow = ({onItemClick}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const location = useLocation();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleItemClick = (path) => {
    onItemClick(path);
    handleClose();
  };

  return (
    <>
      <Button
        onClick={handleClick}
        className={`inline-flex justify-center items-center w-full px-4 py-2 text-sm font-medium ${
          anchorEl ? "text-blue-700" : "text-gray-700"
        } bg-white border border-gray-300 rounded-lg hover:bg-gray-100 border-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-green-500`}
        aria-controls="simple-menu"
        aria-haspopup="true"
      >
        Learn &amp; Grow
      </Button>
      <Menu
        id="simple-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <MenuItem
          component={Link}
          to="/resources"
          onClick={() => handleItemClick("/resources")}
          className={`px-4 py-2 text-sm font-semibold ${
            location.pathname === "/resources" ? "text-blue-700" : "text-gray-700"
          } hover:bg-emerald-600 hover:text-white`}
        >
          View Resources
        </MenuItem>
        <MenuItem
          component={Link}
          to="/postresources"
          onClick={() => handleItemClick("/postresources")}
          className={`px-4 py-2 text-sm font-semibold ${
            location.pathname === "/postresources" ? "text-blue-700" : "text-gray-700"
          } hover:bg-emerald-600 hover:text-white`}
        >
          Post Resources
        </MenuItem>
      </Menu>
    </>
  );
};

export default LearnNGrow;
