#!/bin/bash

# Deployment script for govt-fund-ai

# Step 1: Stop any running server
echo "Stopping any running server..."
pkill -f "node server.js" || echo "No server was running"

# Step 2: Install dependencies in the main directory
echo "Installing dependencies in the main directory..."
npm install

# Step 3: Start the server in the background
echo "Starting the server..."
nohup node server.js > server.log 2>&1 &

# Step 4: Wait a moment and check if the server is running
sleep 3
if pgrep -f "node server.js" > /dev/null; then
  echo "Server started successfully on port 3000!"
  echo "Access the application at https://kvzd.info"
else
  echo "Server failed to start. Check server.log for details."
  cat server.log
fi

echo "Deployment complete!" 