#!/bin/bash
#
# Generate application icons for electron-builder from an SVG source.
# Usage: ./scripts/generate-icons.sh <input.svg>
#
# Requirements: imagemagick, libicns (png2icns)
#

set -euo pipefail

if [[ $# -ne 1 ]]; then
    echo "Usage: $0 <input.svg>"
    exit 1
fi

INPUT_SVG="$1"

if [[ ! -f "$INPUT_SVG" ]]; then
    echo "Error: File '$INPUT_SVG' not found"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="$PROJECT_ROOT/assets/icons"

# Linux icon sizes (electron-builder expects these)
LINUX_SIZES=(16 32 48 64 128 256 512)

# Sizes required for ICNS (macOS) - png2icns accepts: 16, 32, 48, 128, 256, 512, 1024
ICNS_SIZES=(16 32 48 128 256 512)

echo "==> Creating output directory: $OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

echo "==> Generating PNG icons for Linux..."
for size in "${LINUX_SIZES[@]}"; do
    output="$OUTPUT_DIR/${size}x${size}.png"
    echo "    $size x $size"
    magick -density 1200 -background none "$INPUT_SVG" -resize "${size}x${size}" "$output"
done

echo "==> Generating ICO for Windows..."
magick -density 1200 -background none "$INPUT_SVG" -define icon:auto-resize=256,128,64,48,32,16 "$OUTPUT_DIR/icon.ico"
echo "    -> $OUTPUT_DIR/icon.ico"

echo "==> Generating ICNS for macOS..."
icns_inputs=()
for size in "${ICNS_SIZES[@]}"; do
    icns_inputs+=("$OUTPUT_DIR/${size}x${size}.png")
done
png2icns "$OUTPUT_DIR/icon.icns" "${icns_inputs[@]}"
echo "    -> $OUTPUT_DIR/icon.icns"

echo "==> Copying favicon for config UI..."
mkdir -p "$PROJECT_ROOT/src/ui/public"
cp "$OUTPUT_DIR/32x32.png" "$PROJECT_ROOT/src/ui/public/favicon.png"
echo "    -> $PROJECT_ROOT/src/ui/public/favicon.png"

echo ""
echo "Done! Icons generated in $OUTPUT_DIR:"
ls -la "$OUTPUT_DIR"
