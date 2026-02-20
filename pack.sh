#!/bin/bash
# Package the SixKey Braille extension for Chrome Web Store upload
# Usage: ./pack.sh
# Output: sixkey-braille-v{VERSION}.zip

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
EXT_DIR="$SCRIPT_DIR/extension"

# Read version from manifest.json
VERSION=$(grep '"version"' "$EXT_DIR/manifest.json" | head -1 | sed 's/.*"\([0-9.]*\)".*/\1/')
OUTPUT="$SCRIPT_DIR/sixkey-braille-v${VERSION}.zip"

# Remove old zip if exists
rm -f "$OUTPUT"

echo "📦 Packaging SixKey Braille v${VERSION}..."

cd "$EXT_DIR"

# Include all extension files, exclude dev/test files
zip -r "$OUTPUT" . \
  -x "test.html" \
  -x ".DS_Store" \
  -x "*.map"

echo ""
echo "✅ Created: $OUTPUT"
echo "📏 Size: $(du -h "$OUTPUT" | cut -f1)"
echo ""
echo "Next steps:"
echo "  1. Go to https://chrome.google.com/webstore/devconsole"
echo "  2. Click 'New Item' → Upload $OUTPUT"
echo "  3. Fill in the listing details from docs/store_listing.md"
echo "  4. Set privacy policy URL to your hosted privacy.html"
echo "  5. Upload screenshots (1280×800 or 640×400)"
echo "  6. Submit for review"
