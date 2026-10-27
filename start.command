#!/bin/bash
# Double-click to play: starts a small local web server for this folder and
# opens the games in your default browser. Close this window to stop.

cd "$(dirname "$0")" || exit 1

PORT=5173
URL="http://localhost:$PORT/"

if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3 is needed but wasn't found."
  echo "Install it from https://www.python.org/downloads/ and double-click this file again."
  read -r -p "Press Enter to close." _
  exit 1
fi

# Already running (e.g. a second double-click)? Just open the browser.
if nc -z 127.0.0.1 "$PORT" >/dev/null 2>&1; then
  echo "The games are already running. Opening $URL"
  open "$URL"
  exit 0
fi

echo "Starting panipuri minigames at $URL"
echo "Keep this window open while you play. Close it (or press Ctrl+C) to stop."
echo

(sleep 1 && open "$URL") &
exec python3 -m http.server "$PORT" --bind 127.0.0.1
