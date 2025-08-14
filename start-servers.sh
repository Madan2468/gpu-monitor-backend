#!/bin/bash

echo "🚀 Starting GPU Job Monitor Dashboard..."

# Check if MongoDB is running
if ! brew services list | grep -q "mongodb-community.*started"; then
    echo "🔧 Starting MongoDB..."
    brew services start mongodb-community
    sleep 3
else
    echo "✅ MongoDB is already running"
fi

# Start backend in background
echo "🔧 Starting backend server..."
cd backend
nohup npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to initialize..."
sleep 5

# Start frontend in background
echo "🔧 Starting frontend server..."
cd frontend
nohup npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo "🌐 Servers starting..."
echo "📊 Backend: http://localhost:5001"
echo "🖥️  Frontend: http://localhost:3000"
echo "📝 Backend PID: $BACKEND_PID"
echo "📝 Frontend PID: $FRONTEND_PID"
echo ""
echo "📋 To stop servers:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "📊 To view logs:"
echo "   tail -f backend.log"
echo "   tail -f frontend.log"
