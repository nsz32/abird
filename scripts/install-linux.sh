#!/bin/bash
set -e

APPIMAGE=$(find release -name "Bird-*.AppImage" -type f | head -1)

if [ -z "$APPIMAGE" ]; then
    echo "Error: No AppImage found in release/"
    echo "Run 'pnpm package:linux' first"
    exit 1
fi

echo "Installing $APPIMAGE to /usr/local/bin/bird..."
sudo cp "$APPIMAGE" /usr/local/bin/bird
sudo chmod +x /usr/local/bin/bird

echo "Done! You can now run 'bird' from anywhere."
