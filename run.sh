#!/bin/bash

# redxmoro UI - Development Server Launcher
# This script starts both the React frontend and FastAPI backend

set -e

echo "🚀 Starting redxmoro AI Safety Testing UI..."

# Check if required directories exist
if [ ! -d "ui" ]; then
    echo "❌ UI directory not found. Please run from the project root."
    exit 1
fi

if [ ! -d "api" ]; then
    echo "❌ API directory not found. Please run from the project root."
    exit 1
fi

# Function to kill background processes on exit
cleanup() {
    echo "🧹 Cleaning up..."
    kill $(jobs -p) 2>/dev/null || true
}
trap cleanup EXIT

# Start the FastAPI backend (port 8000)
echo "🔧 Starting FastAPI backend on :8000..."
python3 -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 3

echo "🎨 Starting React frontend (Vite dev server)..."
cd ui

# Ensure dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm ci
fi

# Expose backend URLs to the frontend
export VITE_API_URL="http://localhost:8000"
export VITE_WS_URL="ws://localhost:8000/ws"

# Start Vite on port 5173 (default) unless overridden by $PORT
FRONTEND_PORT=${PORT:-5173}
npm run dev -- --port $FRONTEND_PORT --host 0.0.0.0 &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ redxmoro UI is starting up!"
echo ""
echo "🌐 Frontend: http://localhost:${FRONTEND_PORT}"
echo "🔌 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for processes
wait
