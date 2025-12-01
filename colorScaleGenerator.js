// ============================================================
// COLOR SCALE GENERATOR
// Generates Tailwind-style color scales (50-950) from base color
// ============================================================

/**
 * Convert hex color to HSL
 * @param {string} hex - Hex color (e.g., "#3b82f6")
 * @returns {object} - {h, s, l} where h is 0-360, s and l are 0-100
 */
function hexToHsl(hex) {
    // Remove # if present
    hex = hex.replace(/^#/, '');

    // Parse hex to RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
}

/**
 * Convert HSL to hex color
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {string} - Hex color (e.g., "#3b82f6")
 */
function hslToHex(h, s, l) {
    h = h / 360;
    s = s / 100;
    l = l / 100;

    let r, g, b;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    const toHex = x => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Generate Tailwind-style color scale (50-950) from base color
 * @param {string} baseHex - Base color in hex (will be used as 500)
 * @returns {object} - Object with keys 50, 100, 200, ..., 950
 */
function generateColorScale(baseHex) {
    const baseHsl = hexToHsl(baseHex);

    // Tailwind-style lightness values for each shade
    const lightnessMap = {
        50: 97,   // Very light
        100: 94,
        200: 87,
        300: 77,
        400: 62,
        500: baseHsl.l,  // Base color
        600: Math.max(baseHsl.l - 10, 35),
        700: Math.max(baseHsl.l - 20, 25),
        800: Math.max(baseHsl.l - 30, 15),
        900: Math.max(baseHsl.l - 40, 10),
        950: 8    // Very dark
    };

    // Saturation adjustment for lighter shades (reduce saturation)
    const saturationMap = {
        50: Math.max(baseHsl.s - 30, 20),
        100: Math.max(baseHsl.s - 20, 30),
        200: Math.max(baseHsl.s - 10, 40),
        300: Math.max(baseHsl.s - 5, 50),
        400: baseHsl.s,
        500: baseHsl.s,
        600: Math.min(baseHsl.s + 5, 100),
        700: Math.min(baseHsl.s + 10, 100),
        800: Math.min(baseHsl.s + 10, 100),
        900: Math.min(baseHsl.s + 5, 100),
        950: baseHsl.s
    };

    const scale = {};

    for (const shade in lightnessMap) {
        scale[shade] = hslToHex(
            baseHsl.h,
            saturationMap[shade],
            lightnessMap[shade]
        );
    }

    return scale;
}

/**
 * Generate color scales for multiple base colors
 * @param {array} colors - Array of {name, hex} objects
 * @returns {object} - Object with color names as keys, scales as values
 */
function generateColorScales(colors) {
    const scales = {};

    colors.forEach(color => {
        scales[color.name] = generateColorScale(color.hex);
    });

    return scales;
}
