#!/bin/bash

# Viiibe Plugin - Distribution Packaging Script
# Creates a ZIP file with all necessary files for manual distribution

echo "📦 Packaging Viiibe plugin for distribution..."

# Set variables
PLUGIN_DIR="/Users/elnegro/Figma-plugins/viiibe-plugin"
DIST_DIR="$PLUGIN_DIR/distribution"
ZIP_NAME="viiibe-plugin-distribution.zip"

# Create distribution directory
echo "Creating distribution directory..."
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR/viiibe-plugin"
mkdir -p "$DIST_DIR/viiibe-plugin/dist"

# Copy required files
echo "Copying files..."
cp "$PLUGIN_DIR/manifest.json" "$DIST_DIR/viiibe-plugin/"
cp "$PLUGIN_DIR/code.js" "$DIST_DIR/viiibe-plugin/"
cp "$PLUGIN_DIR/dist/index.html" "$DIST_DIR/viiibe-plugin/dist/"
cp "$PLUGIN_DIR/TESTING_GUIDE.md" "$DIST_DIR/viiibe-plugin/"

# Create README for recipients
cat > "$DIST_DIR/viiibe-plugin/README.md" << 'EOF'
# Viiibe Plugin - Installation Instructions

## Quick Start

1. **Extract this folder** to a location on your computer
2. **Open Figma Desktop** (must use desktop app)
3. **Import the plugin:**
   - Menu → Plugins → Development → "Import plugin from manifest..."
   - Select the `manifest.json` file in this folder
4. **Run the plugin:**
   - Menu → Plugins → Development → Viiibe

## What to Test

See [TESTING_GUIDE.md](TESTING_GUIDE.md) for detailed testing instructions.

## Need Help?

Contact the plugin developer for support.
EOF

# Create ZIP file
echo "Creating ZIP archive..."
cd "$DIST_DIR"
zip -r "$ZIP_NAME" viiibe-plugin/

# Move ZIP to project root
mv "$ZIP_NAME" "$PLUGIN_DIR/"

# Clean up
rm -rf "$DIST_DIR"

echo "✅ Done! Package created: $PLUGIN_DIR/$ZIP_NAME"
echo ""
echo "📤 Share this file with your colleagues:"
echo "   $PLUGIN_DIR/$ZIP_NAME"
echo ""
echo "📋 They should follow the instructions in the included README.md"
