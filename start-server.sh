#!/bin/bash
# Simple script to start the local server

cd "$(dirname "$0")"
echo "Starting server on http://localhost:8000"
echo "Open: http://localhost:8000/inventory-ordering.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python3 -m http.server 8000

