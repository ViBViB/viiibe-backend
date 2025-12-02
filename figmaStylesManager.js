// ============================================================
// FIGMA STYLES MANAGER
// Manages creation and updating of Figma Color and Text Styles
// All styles use "Viiibe-" prefix to avoid conflicts
// ============================================================

/**
 * Convert hex color to Figma RGB format
 * @param {string} hex - Hex color (e.g., "#3b82f6")
 * @returns {object} - {r, g, b} where values are 0-1
 */
function hexToFigmaRgb(hex) {
    hex = hex.replace(/^#/, '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    return { r, g, b };
}

/**
 * Create or update a Figma Color Style
 * @param {string} name - Style name (e.g., "Primitives/Primary/500")
 * @param {string} hex - Hex color
 * @returns {PaintStyle} - Created or updated Figma PaintStyle
 */
function createColorStyle(name, hex) {
    const fullName = `Viiibe-${name}`;

    // Check if style already exists
    const existingStyles = figma.getLocalPaintStyles();
    let style = existingStyles.find(s => s.name === fullName);

    if (!style) {
        // Create new style
        style = figma.createPaintStyle();
        style.name = fullName;
        console.log(`Created color style: ${fullName}`);
    } else {
        console.log(`Updated color style: ${fullName}`);
    }

    // Set the color
    const rgb = hexToFigmaRgb(hex);
    style.paints = [{ type: "SOLID", color: rgb }];

    return style;
}

/**
 * Create color styles for an entire color scale
 * @param {string} colorName - Color name (e.g., "Primary")
 * @param {object} scale - Scale object with shades (50, 100, ..., 950)
 */
function createColorScaleStyles(colorName, scale) {
    const styles = {};

    for (const shade in scale) {
        const styleName = `Primitives/${colorName}/${shade}`;
        styles[shade] = createColorStyle(styleName, scale[shade]);
    }

    return styles;
}

/**
 * Create color styles for all color scales
 * @param {object} colorScales - Object with color names as keys, scales as values
 */
function createAllColorStyles(colorScales) {
    const allStyles = {};

    for (const colorName in colorScales) {
        console.log(`Creating styles for ${colorName}...`);
        allStyles[colorName] = createColorScaleStyles(colorName, colorScales[colorName]);
    }

    console.log(`✅ Created color styles for ${Object.keys(colorScales).length} colors`);
    return allStyles;
}

/**
 * Get all Viiibe styles (for debugging/cleanup)
 * @returns {array} - Array of all Viiibe color styles
 */
function getViiibeColorStyles() {
    const allStyles = figma.getLocalPaintStyles();
    return allStyles.filter(s => s.name.startsWith('Viiibe-'));
}

/**
 * Delete all Viiibe color styles (use with caution!)
 * Only use this for cleanup during development
 * @returns {number} - Number of styles deleted
 */
function deleteViiibeColorStyles() {
    const viibeStyles = getViiibeColorStyles();
    viibeStyles.forEach(style => {
        style.remove();
    });
    console.log(`Deleted ${viibeStyles.length} Viiibe color styles`);
    return viibeStyles.length;
}
