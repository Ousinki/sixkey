#!/bin/bash
# SixKey RIME Schema Installer
# Deploys braille input schemas to ~/Library/Rime/

set -e

RIME_DIR="$HOME/Library/Rime"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🔤 SixKey RIME Installer"
echo "========================"

# Check if RIME directory exists
if [ ! -d "$RIME_DIR" ]; then
    echo "❌ RIME directory not found at $RIME_DIR"
    echo "   Please install Squirrel (鼠须管) first: https://rime.im/"
    exit 1
fi

echo "📁 RIME directory: $RIME_DIR"

# Copy schema and dictionary files
echo "📋 Copying schema files..."
cp "$SCRIPT_DIR/sixkey_text2braille.schema.yaml" "$RIME_DIR/"
cp "$SCRIPT_DIR/sixkey_text2braille.dict.yaml" "$RIME_DIR/"
cp "$SCRIPT_DIR/sixkey_braille.schema.yaml" "$RIME_DIR/"
echo "✅ Schema files copied"

# Check schema list
CUSTOM_FILE="$RIME_DIR/default.custom.yaml"
echo ""
echo "📝 Schema registration:"
if [ -f "$CUSTOM_FILE" ]; then
    if grep -q "sixkey_text2braille" "$CUSTOM_FILE"; then
        echo "   ✅ sixkey_text2braille already registered"
    else
        echo "   ⚠️  Please add to schema_list in $CUSTOM_FILE:"
        echo "      - schema: sixkey_text2braille"
    fi
    if grep -q "sixkey_braille" "$CUSTOM_FILE"; then
        echo "   ✅ sixkey_braille already registered"
    else
        echo "   ⚠️  Please add to schema_list in $CUSTOM_FILE:"
        echo "      - schema: sixkey_braille"
    fi
else
    echo "   ⚠️  No default.custom.yaml found. Creating one..."
    cat > "$CUSTOM_FILE" << 'EOF'
patch:
  schema_list:
    - schema: sixkey_text2braille
    - schema: sixkey_braille
EOF
    echo "   ✅ Created with SixKey schemas"
fi

echo ""
echo "✅ Installation complete!"
echo ""
echo "⚡ Next steps:"
echo "   1. Click Squirrel (鼠须管) icon in menu bar → 重新部署"
echo "   2. Press Ctrl+\` or F4 to open schema selector"
echo "   3. Choose 'SixKey 文转盲文' or 'SixKey 盲文打字'"
echo ""
