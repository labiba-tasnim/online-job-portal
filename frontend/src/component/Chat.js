import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { TextField, Button, Typography } from "@material-ui/core";

const Chat = ({ userId, recipientId }) => {
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const socket = io("http://localhost:3000/", {
    auth: { token: "your_jwt_token_here" },
  });

  useEffect(() => {
    // Listen for incoming chat messages
    socket.on("chatMessage", (data) => {
      setChatMessages((prevMessages) => [
        ...prevMessages,
        { senderId: data.senderId, message: data.message },
      ]);
    });

    // Clean up the socket connection when the component unmounts
    return () => {
      socket.disconnect();
    };
  }, []);

  const sendMessage = () => {
    // Send the chat message to the server
    socket.emit("chatMessage", {
      recipientId: recipientId,
      message: message,
    });

    // Update the local state with the sent message
    setChatMessages((prevMessages) => [
      ...prevMessages,
      { senderId: userId, message: message },
    ]);

    // Clear the input field
    setMessage("");
  };

  return (
    <div>
      <div>
        {chatMessages.map((msg, index) => (
          <div key={index}>
            {msg.senderId === userId ? "You: " : `User ${msg.senderId}: `}
            {msg.message}
          </div>
        ))}
      </div>
      <div>
        <TextField
          type="text"
          label="Type your message"
          variant="outlined"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <Button variant="contained" color="primary" onClick={sendMessage}>
          Send
        </Button>
      </div>
    </div>
  );
};

export default Chat;
