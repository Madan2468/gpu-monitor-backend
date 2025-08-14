#!/bin/bash

# GPU Job Monitoring Dashboard - Quick Start Script

echo "🚀 Starting GPU Job Monitoring Dashboard..."

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB not running. Starting MongoDB..."
    brew services start mongodb-community
    sleep 3
fi

# Create uploads directory if it doesn't exist
mkdir -p backend/uploads

echo "📁 Created backend/uploads directory"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start backend in background
echo "🔧 Starting backend server..."
cd backend && npm run dev &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 5

# Start frontend in background
echo "🎨 Starting frontend..."
cd ../frontend && npm start &
FRONTEND_PID=$!

echo ""
echo "✅ Both services are starting up!"
echo "📊 Dashboard will open at: http://localhost:3000"
echo "🔌 Backend API available at: http://localhost:5001"
echo ""
echo "Press Ctrl+C to stop both services"

# Keep script running
wait
