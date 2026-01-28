#!/bin/bash
set -e

APPIMAGE=$(find release -name "ABird-*.AppImage" -type f | head -1)

if [ -z "$APPIMAGE" ]; then
    echo "Error: No AppImage found in release/"
    echo "Run 'pnpm package:linux' first"
    exit 1
fi

echo "Installing $APPIMAGE to /usr/local/bin/abird..."
sudo cp "$APPIMAGE" /usr/local/bin/abird
sudo chmod +x /usr/local/bin/abird

echo "Done! You can now run 'abird' from anywhere."
