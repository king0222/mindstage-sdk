#!/bin/bash

# Mind Map SDK - HTTP Server Startup Script
# This script starts a server from the correct directory

cd "$(dirname "$0")/.." || exit 1

echo "🚀 Starting Mind Map SDK HTTP Server..."
echo ""
echo "📁 Server root: $(pwd)"
echo "📦 SDK location: $(pwd)/dist/index.js"
echo "🌐 Examples location: $(pwd)/examples/index.html"
echo ""
echo "✅ Server will be available at:"
echo "   - Examples: http://localhost:8080/examples/index.html"
echo "   - Test: http://localhost:8080/examples/test.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python3 -m http.server 8080


