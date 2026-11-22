#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
EXT="$ROOT/Logic/VSCodeExtension/promptineer"
BACK="$ROOT/Logic/BackEnd"

# Extension: install deps once, then compile
if [ ! -d "$EXT/node_modules" ]; then
  npm --prefix "$EXT" install
fi
npm --prefix "$EXT" run compile

# Backend: echo_server.py uses only the Python standard library
python3 "$BACK/src/echo_server.py" &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null || true' EXIT

# Open VS Code with the extension loaded and BackEnd as the workspace
code --extensionDevelopmentPath="$EXT" "$BACK"

echo "Backend: http://127.0.0.1:8000  |  Ctrl+C here stops it"
wait $SERVER_PID
