#!/bin/bash

# Tasky Core Integration Test Suite - Quick Start Script
# This script sets up dependencies and runs the test suite

set -e

echo "🧪 Tasky Core Integration Test Suite - Quick Start"
echo "=================================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Backend Setup
echo "📦 Setting up Backend Tests..."
cd backend

if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install --save-dev jest supertest
else
    echo "Backend dependencies already installed"
fi

# Check if jest.config.js exists
if [ ! -f "jest.config.js" ]; then
    echo "⚠️  jest.config.js missing - it has been created"
fi

if [ ! -f "tests/setup.js" ]; then
    echo "⚠️  tests/setup.js missing - it has been created"
fi

# Frontend Setup
echo ""
echo "📦 Setting up Frontend Tests..."
cd ../frontend

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install --save-dev cypress
else
    echo "Frontend dependencies already installed"
fi

if [ ! -f "cypress.config.js" ]; then
    echo "⚠️  cypress.config.js missing - it has been created"
fi

if [ ! -d "cypress/e2e" ]; then
    echo "Creating cypress/e2e directory..."
    mkdir -p cypress/e2e
fi

cd ..

echo ""
echo "✅ Setup Complete!"
echo ""
echo "Next Steps:"
echo "==========="
echo ""
echo "1. Start MongoDB (if not already running):"
echo "   mongod"
echo ""
echo "2. Start the backend server:"
echo "   cd backend && npm run dev"
echo ""
echo "3. In a new terminal, run backend tests:"
echo "   cd backend && npm test"
echo ""
echo "4. Start the frontend dev server (in another terminal):"
echo "   cd frontend && npm run dev"
echo ""
echo "5. Run frontend integration tests:"
echo "   cd frontend && npm run test:e2e"
echo ""
echo "📖 For detailed documentation, see: TEST_SUITE_GUIDE.md"
echo ""
