// ==============================================================
// MOOD! — BACKEND FINAL (COMPATIBLE)
// ==============================================================

figma.showUI(__html__, { width: 720, height: 760, title: "Viiibe" });

// ==============================================================
// NLP SEARCH MODULE
// ==============================================================

// Keyword dictionaries for entity extraction
const NLP_KEYWORDS = {
  projectTypes: {
    'landing page': ['landing', 'página', 'homepage', 'home page', 'landing page', 'hero', 'hero section'],
    'dashboard': ['dashboard', 'panel', 'analytics', 'admin', 'admin panel', 'control panel', 'metrics'],
    'mobile app': ['mobile', 'app', 'ios', 'android', 'smartphone', 'phone', 'aplicación móvil', 'aplicacion movil'],
    'ecommerce': ['ecommerce', 'e-commerce', 'shop', 'store', 'tienda', 'shopping', 'cart', 'checkout', 'product'],
    'saas': ['saas', 'software', 'platform', 'plataforma', 'web app', 'webapp'],
    'portfolio': ['portfolio', 'portafolio', 'showcase', 'work', 'projects'],
    'blog': ['blog', 'article', 'post', 'content', 'editorial']
  },
  styles: {
    'minimalist': ['minimalist', 'minimal', 'clean', 'simple', 'whitespace', 'white space', 'espacio', 'limpio', 'minimalista', 'sencillo'],
    'bold': ['bold', 'vibrant', 'colorful', 'bright', 'vivid', 'llamativo', 'vibrante', 'intenso', 'energetic'],
    'dark': ['dark', 'dark mode', 'black', 'oscuro', 'negro', 'night', 'nocturno'],
    'monochrome': ['monochrome', 'black and white', 'grayscale', 'monocromático', 'blanco y negro', 'b&w'],
    'modern': ['modern', 'contemporary', 'moderno', 'actual', 'trendy', 'current'],
    'elegant': ['elegant', 'sophisticated', 'elegante', 'sofisticado', 'refined', 'luxury', 'premium'],
    'playful': ['playful', 'fun', 'friendly', 'casual', 'divertido', 'alegre', 'jovial'],
    'professional': ['professional', 'corporate', 'business', 'formal', 'profesional', 'corporativo'],
    'vintage': ['vintage', 'retro', 'classic', 'old school', 'clásico', 'antiguo'],
    'futuristic': ['futuristic', 'sci-fi', 'tech', 'cyber', 'futurista', 'tecnológico']
  },
  colors: {
    'red': ['red', 'rojo', 'crimson', 'scarlet', 'ruby', 'cherry'],
    'blue': ['blue', 'azul', 'navy', 'cyan', 'cobalt', 'sky'],
    'green': ['green', 'verde', 'emerald', 'lime', 'forest'],
    'yellow': ['yellow', 'amarillo', 'gold', 'golden', 'sunshine'],
    'orange': ['orange', 'naranja', 'tangerine', 'coral'],
    'purple': ['purple', 'morado', 'violet', 'lavender', 'plum'],
    'pink': ['pink', 'rosa', 'magenta', 'fuchsia', 'rose'],
    'black': ['black', 'negro', 'dark', 'oscuro'],
    'white': ['white', 'blanco', 'light', 'claro'],
    'gray': ['gray', 'grey', 'gris', 'silver', 'neutral'],
    'brown': ['brown', 'marrón', 'tan', 'beige', 'earth']
  },
  moods: {
    'calm': ['calm', 'peaceful', 'serene', 'tranquil', 'tranquilo', 'sereno', 'relajado'],
    'energetic': ['energetic', 'dynamic', 'active', 'enérgico', 'dinámico', 'activo'],
    'warm': ['warm', 'cozy', 'inviting', 'cálido', 'acogedor'],
    'cool': ['cool', 'fresh', 'crisp', 'fresco', 'frío']
  },
  elements: {
    'gradient': ['gradient', 'gradiente', 'fade', 'blend'],
    'texture': ['texture', 'textura', 'pattern', 'patrón'],
    'illustration': ['illustration', 'ilustración', 'drawing', 'dibujo', 'illustrated'],
    'photography': ['photo', 'photography', 'fotografía', 'image', 'picture'],
    '3d': ['3d', 'three dimensional', 'dimensional', 'depth'],
    'flat': ['flat', 'plano', 'flat design', '2d'],
    'glassmorphism': ['glass', 'glassmorphism', 'frosted', 'blur', 'vidrio'],
    'neumorphism': ['neumorphism', 'soft ui', 'neomorphism']
  },
  layouts: {
    'grid': ['grid', 'cuadrícula', 'tiles', 'mosaic'],
    'asymmetric': ['asymmetric', 'asymmetrical', 'asimétrico', 'irregular'],
    'centered': ['centered', 'center', 'centrado', 'middle'],
    'fullwidth': ['full width', 'fullwidth', 'wide', 'ancho completo'],
    'sidebar': ['sidebar', 'side panel', 'barra lateral']
  }
};

// Board name mapping (maps NLP entities to actual Pinterest board names)
const BOARD_MAPPING = {
  // Project Types
  'landing page': 'Landing page',
  'dashboard': 'Dashboard UI',
  'mobile app': 'Mobile App UI',
  'ecommerce': 'E-commerce Design',
  'saas': 'Landing page', // Fallback to landing pages
  'portfolio': 'Landing page',
  'blog': 'Landing page',

  // Styles
  'minimalist': 'Minimalist Design',
  'bold': 'Bold Design',
  'dark': 'Dark Mode Design',
  'monochrome': 'Monochrome Design',
  'modern': 'Minimalist Design', // Modern often overlaps with minimalist
  'elegant': 'Minimalist Design',
  'playful': 'Bold Design',
  'professional': 'Dashboard UI',
  'vintage': 'Landing page',
  'futuristic': 'Dashboard UI',

  // Colors
  'red': 'Red Design',
  'blue': 'Blue Design',
  'green': 'Landing page',
  'yellow': 'Bold Design',
  'orange': 'Bold Design',
  'purple': 'Landing page',
  'pink': 'Landing page',
  'black': 'Dark Mode Design',
  'white': 'Minimalist Design',
  'gray': 'Minimalist Design',
  'brown': 'Landing page',

  // Moods
  'calm': 'Minimalist Design',
  'energetic': 'Bold Design',
  'warm': 'Landing page',
  'cool': 'Blue Design',

  // Elements
  'gradient': 'Bold Design',
  'texture': 'Landing page',
  'illustration': 'Landing page',
  'photography': 'Landing page',
  '3d': 'Landing page',
  'flat': 'Minimalist Design',
  'glassmorphism': 'Minimalist Design',
  'neumorphism': 'Minimalist Design',

  // Layouts
  'grid': 'Dashboard UI',
  'asymmetric': 'Landing page',
  'centered': 'Minimalist Design',
  'fullwidth': 'Landing page',
  'sidebar': 'Dashboard UI'
};

// Cache for user's boards (to avoid repeated API calls)
let cachedBoards = null;

// ==============================================================
// PINTEREST API HELPERS (via Vercel Proxy)
// ==============================================================

const PROXY_URL = 'https://viiibe-backend-hce5.vercel.app/api/pinterest-proxy';

/**
 * Fetch all boards for the authenticated user
 */
async function fetchUserBoards(token) {
  if (cachedBoards) {
    console.log("Using cached boards");
    return cachedBoards;
  }

  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'get-boards',
        token: token
      })
    });

    if (!response.ok) {
      console.error("Failed to fetch boards:", response.status);
      return [];
    }

    const data = await response.json();
    cachedBoards = data.items || [];
    console.log("Fetched " + cachedBoards.length + " boards from Pinterest");
    return cachedBoards;
  } catch (error) {
    console.error("Error fetching boards:", error);
    return [];
  }
}

/**
 * Find a board by name
 */
async function findBoardByName(boardName, token) {
  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'find-board',
        boardName: boardName,
        token: token
      })
    });

    if (!response.ok) {
      console.error("Board not found:", boardName);
      return null;
    }

    const board = await response.json();
    return board;
  } catch (error) {
    console.error("Error finding board:", error);
    return null;
  }
}

/**
 * Fetch pins from a specific board
 */
async function fetchBoardPins(boardId, token, pageSize) {
  if (!pageSize) pageSize = 50;

  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'get-board-pins',
        boardId: boardId,
        token: token,
        pageSize: pageSize
      })
    });

    if (!response.ok) {
      console.error("❌ Failed to fetch pins for board " + boardId + ":", response.status);
      const errorData = await response.json();
      console.error("Error response:", JSON.stringify(errorData, null, 2));
      return [];
    }

    const data = await response.json();
    console.log("📦 Pinterest API response for board " + boardId + ":", JSON.stringify(data, null, 2));
    const items = data.items || [];

    // Transform Pinterest API format to our format
    const pins = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Pinterest V5 API format: media.images contains different sizes
      // Available sizes: 150x150, 400x300, 600x, 1200x
      let imageUrl = '';
      let fullsizeUrl = '';
      let thumbnailUrl = '';

      if (item.media && item.media.images) {
        const images = item.media.images;

        // Use 600x for main display (good balance of quality and size)
        imageUrl = images['600x'] ? images['600x'].url : '';

        // Use 1200x for fullsize/lightbox
        fullsizeUrl = images['1200x'] ? images['1200x'].url : imageUrl;

        // Use 400x300 for thumbnail
        thumbnailUrl = images['400x300'] ? images['400x300'].url : imageUrl;

        // Fallback: if none of the above exist, try any available size
        if (!imageUrl) {
          if (images['1200x']) imageUrl = images['1200x'].url;
          else if (images['400x300']) imageUrl = images['400x300'].url;
          else if (images['150x150']) imageUrl = images['150x150'].url;
        }
      }

      pins.push({
        id: item.id,
        title: item.title || '',
        description: item.description || '',
        link: item.link || ('https://www.pinterest.com/pin/' + item.id),
        image: imageUrl,
        fullsizeUrl: fullsizeUrl,
        thumbnailUrl: thumbnailUrl
      });
    }

    return pins;
  } catch (error) {
    console.error("Error fetching board pins:", error);
    return [];
  }
}

/**
 * Search Pinterest globally using the search API
 * @param {string} searchTerm - Search query
 * @param {string} token - Pinterest access token
 * @param {number} limit - Maximum number of results (default 50)
 * @returns {Array} - Array of pins from global search
 */
async function searchPinterestGlobally(searchTerm, token, limit) {
  if (!limit) limit = 50;

  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'search-pins',
        searchTerm: searchTerm,
        token: token,
        limit: limit,
        countryCode: 'US' // TODO: Make this configurable
      })
    });

    if (!response.ok) {
      console.error("❌ Failed to search Pinterest globally:", response.status);
      const errorData = await response.json();
      console.error("Error response:", JSON.stringify(errorData, null, 2));
      return [];
    }

    const data = await response.json();
    console.log("📦 Global Pinterest search response:", data.items ? data.items.length + " pins found" : "0 pins");
    const items = data.items || [];

    // Transform Pinterest API format to our format
    const pins = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Pinterest V5 API format: media.images contains different sizes
      let imageUrl = '';
      let fullsizeUrl = '';
      let thumbnailUrl = '';

      if (item.media && item.media.images) {
        const images = item.media.images;

        // Use 600x for main display
        imageUrl = images['600x'] ? images['600x'].url : '';

        // Use 1200x for fullsize/lightbox
        fullsizeUrl = images['1200x'] ? images['1200x'].url : imageUrl;

        // Use 400x300 for thumbnail
        thumbnailUrl = images['400x300'] ? images['400x300'].url : imageUrl;

        // Fallback: if none of the above exist, try any available size
        if (!imageUrl) {
          if (images['1200x']) imageUrl = images['1200x'].url;
          else if (images['400x300']) imageUrl = images['400x300'].url;
          else if (images['150x150']) imageUrl = images['150x150'].url;
        }
      }

      pins.push({
        id: item.id,
        title: item.title || '',
        description: item.description || '',
        link: item.link || ('https://www.pinterest.com/pin/' + item.id),
        image: imageUrl,
        fullsizeUrl: fullsizeUrl,
        thumbnailUrl: thumbnailUrl
      });
    }

    return pins;
  } catch (error) {
    console.error("Error searching Pinterest globally:", error);
    return [];
  }
}

/**
 * Analyze user's natural language query to extract intent
 * @param {string} query - User's search query
 * @returns {Object} - Structured intent with project type, styles, and colors
 */
function analyzeSearchIntent(query) {
  const lowerQuery = query.toLowerCase();
  const intent = {
    projectType: null,
    styles: [],
    colors: [],
    moods: [],
    elements: [],
    layouts: [],
    rawQuery: query
  };

  // Extract project type (first match wins)
  const projectTypeKeys = Object.keys(NLP_KEYWORDS.projectTypes);
  for (let i = 0; i < projectTypeKeys.length; i++) {
    const type = projectTypeKeys[i];
    const keywords = NLP_KEYWORDS.projectTypes[type];
    let found = false;
    for (let j = 0; j < keywords.length; j++) {
      if (lowerQuery.indexOf(keywords[j]) !== -1) {
        found = true;
        break;
      }
    }
    if (found) {
      intent.projectType = type;
      break;
    }
  }

  // Extract styles (can have multiple)
  const styleKeys = Object.keys(NLP_KEYWORDS.styles);
  for (let i = 0; i < styleKeys.length; i++) {
    const style = styleKeys[i];
    const keywords = NLP_KEYWORDS.styles[style];
    for (let j = 0; j < keywords.length; j++) {
      if (lowerQuery.indexOf(keywords[j]) !== -1) {
        intent.styles.push(style);
        break;
      }
    }
  }

  // Extract colors (can have multiple)
  const colorKeys = Object.keys(NLP_KEYWORDS.colors);
  for (let i = 0; i < colorKeys.length; i++) {
    const color = colorKeys[i];
    const keywords = NLP_KEYWORDS.colors[color];
    for (let j = 0; j < keywords.length; j++) {
      if (lowerQuery.indexOf(keywords[j]) !== -1) {
        intent.colors.push(color);
        break;
      }
    }
  }

  // Extract moods (can have multiple)
  const moodKeys = Object.keys(NLP_KEYWORDS.moods);
  for (let i = 0; i < moodKeys.length; i++) {
    const mood = moodKeys[i];
    const keywords = NLP_KEYWORDS.moods[mood];
    for (let j = 0; j < keywords.length; j++) {
      if (lowerQuery.indexOf(keywords[j]) !== -1) {
        intent.moods.push(mood);
        break;
      }
    }
  }

  // Extract elements (can have multiple)
  const elementKeys = Object.keys(NLP_KEYWORDS.elements);
  for (let i = 0; i < elementKeys.length; i++) {
    const element = elementKeys[i];
    const keywords = NLP_KEYWORDS.elements[element];
    for (let j = 0; j < keywords.length; j++) {
      if (lowerQuery.indexOf(keywords[j]) !== -1) {
        intent.elements.push(element);
        break;
      }
    }
  }

  // Extract layouts (can have multiple)
  const layoutKeys = Object.keys(NLP_KEYWORDS.layouts);
  for (let i = 0; i < layoutKeys.length; i++) {
    const layout = layoutKeys[i];
    const keywords = NLP_KEYWORDS.layouts[layout];
    for (let j = 0; j < keywords.length; j++) {
      if (lowerQuery.indexOf(keywords[j]) !== -1) {
        intent.layouts.push(layout);
        break;
      }
    }
  }

  return intent;
}

/**
 * Map search intent to relevant Pinterest boards with relevance scores
 * @param {Object} intent - Structured search intent
 * @returns {Array} - Array of {name, score} objects
 */
function mapToBoards(intent) {
  const boards = [];
  const seen = new Set();

  // Add project type board (highest priority)
  if (intent.projectType && BOARD_MAPPING[intent.projectType]) {
    const boardName = BOARD_MAPPING[intent.projectType];
    boards.push({ name: boardName, score: 1.0 });
    seen.add(boardName);
  }

  // Add style boards (high priority)
  for (let i = 0; i < intent.styles.length; i++) {
    const style = intent.styles[i];
    if (BOARD_MAPPING[style] && !seen.has(BOARD_MAPPING[style])) {
      const boardName = BOARD_MAPPING[style];
      boards.push({ name: boardName, score: 0.9 });
      seen.add(boardName);
    }
  }

  // Add color boards (medium-high priority)
  for (let i = 0; i < intent.colors.length; i++) {
    const color = intent.colors[i];
    if (BOARD_MAPPING[color] && !seen.has(BOARD_MAPPING[color])) {
      const boardName = BOARD_MAPPING[color];
      boards.push({ name: boardName, score: 0.8 });
      seen.add(boardName);
    }
  }

  // Add mood boards (medium priority)
  for (let i = 0; i < intent.moods.length; i++) {
    const mood = intent.moods[i];
    if (BOARD_MAPPING[mood] && !seen.has(BOARD_MAPPING[mood])) {
      const boardName = BOARD_MAPPING[mood];
      boards.push({ name: boardName, score: 0.7 });
      seen.add(boardName);
    }
  }

  // Add element boards (medium priority)
  for (let i = 0; i < intent.elements.length; i++) {
    const element = intent.elements[i];
    if (BOARD_MAPPING[element] && !seen.has(BOARD_MAPPING[element])) {
      const boardName = BOARD_MAPPING[element];
      boards.push({ name: boardName, score: 0.7 });
      seen.add(boardName);
    }
  }

  // Add layout boards (lower priority)
  for (let i = 0; i < intent.layouts.length; i++) {
    const layout = intent.layouts[i];
    if (BOARD_MAPPING[layout] && !seen.has(BOARD_MAPPING[layout])) {
      const boardName = BOARD_MAPPING[layout];
      boards.push({ name: boardName, score: 0.6 });
      seen.add(boardName);
    }
  }

  // If no boards matched, return all boards with low score (fallback)
  if (boards.length === 0) {
    const allBoardNames = ['Landing page', 'Dashboard UI', 'Mobile App UI', 'E-commerce Design', 'Minimalist Design', 'Bold Design', 'Dark Mode Design', 'Monochrome Design', 'Red Design', 'Blue Design'];
    for (let i = 0; i < allBoardNames.length; i++) {
      boards.push({ name: allBoardNames[i], score: 0.5 });
    }
  }

  return boards;
}


// --------------------------------------------------------------
// HELPERS
// --------------------------------------------------------------
function hexToFigmaRgb(hex) {
  const c = hex.replace("#", "");
  return {
    r: parseInt(c.substring(0, 2), 16) / 255,
    g: parseInt(c.substring(2, 4), 16) / 255,
    b: parseInt(c.substring(4, 6), 16) / 255,
  };
}

// --------------------------------------------------------------
// COLOR SCALE GENERATOR (Tailwind-style 50-950)
// --------------------------------------------------------------
function hexToHsl(hex) {
  hex = hex.replace(/^#/, '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
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

function hslToHex(h, s, l) {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
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

function generateColorScale(baseHex) {
  const baseHsl = hexToHsl(baseHex);
  const scale = {};

  // 1. Fix 500 to be exactly the base color
  scale['500'] = baseHex;

  // 2. Interpolate Lighter Shades (50-400)
  // From L=98 (almost white) to baseHsl.l
  const lighterShades = ['50', '100', '200', '300', '400'];
  const totalLighterSteps = lighterShades.length + 1; // +1 for the gap to 500
  const lighterStepSize = (baseHsl.l - 98) / totalLighterSteps;

  lighterShades.forEach((shade, i) => {
    const l = 98 + (lighterStepSize * (i + 1));
    // Optional: Slight saturation adjustment for very light shades could go here
    // For now, keeping saturation constant to ensure brand consistency
    scale[shade] = hslToHex(baseHsl.h, baseHsl.s, l);
  });

  // 3. Interpolate Darker Shades (600-950)
  // From baseHsl.l to L=5 (almost black)
  const darkerShades = ['600', '700', '800', '900', '950'];
  const totalDarkerSteps = darkerShades.length + 1; // +1 for the gap from 500
  const darkerStepSize = (5 - baseHsl.l) / totalDarkerSteps;

  darkerShades.forEach((shade, i) => {
    const l = baseHsl.l + (darkerStepSize * (i + 1));
    scale[shade] = hslToHex(baseHsl.h, baseHsl.s, l);
  });

  return scale;
}

// --------------------------------------------------------------
// FIGMA VARIABLES MANAGER
// --------------------------------------------------------------

async function getOrCreateCollection(name) {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  let collection = collections.find(c => c.name === name);
  if (!collection) {
    collection = figma.variables.createVariableCollection(name);
    console.log(`✨ Created collection: ${name}`);
  }
  return collection;
}

async function createColorVariable(name, color, collectionId) {
  const variables = await figma.variables.getLocalVariablesAsync();
  let variable = variables.find(v => v.name === name && v.variableCollectionId === collectionId);

  // Get the collection to access mode
  const collection = await figma.variables.getVariableCollectionByIdAsync(collectionId);
  const modeId = collection.modes[0].modeId;

  if (!variable) {
    // Pass collection object instead of collectionId
    variable = figma.variables.createVariable(name, collection, "COLOR");
  }

  // Set value (RGB or Alias)
  variable.setValueForMode(modeId, color);

  return variable;
}

async function createPrimitivesCollection(colorScales) {
  const collection = await getOrCreateCollection("Viiibe Primitives");
  const primitives = {};

  // 1. COLORS
  console.log("Creating Color Primitives...");
  for (const colorName in colorScales) {
    const scale = colorScales[colorName];
    primitives[colorName] = {};

    for (const shade in scale) {
      // Prefix with "Color/" for better organization
      const variableName = `Color/${colorName}/${shade}`;
      const rgb = hexToFigmaRgb(scale[shade]);
      const variable = await createColorVariable(variableName, rgb, collection.id);
      primitives[colorName][shade] = variable;
    }
  }

  // 2. SIZES (Tailwind Spacing Scale)
  console.log("Creating Size Primitives...");
  await createSizeVariables(collection.id);

  // 3. TYPE SIZES (Tailwind Typography Scale)
  console.log("Creating Type Size Primitives...");
  const typeSizes = await createTypeSizeVariables(collection.id);

  // 4. TYPOGRAPHY (Font Family & Weight)
  const typography = await createTypographyVariables(collection.id);

  return { colorPrimitives: primitives, typeSizes, typography };
}

async function createSizeVariables(collectionId) {
  // Tailwind Spacing Scale (rem -> px, assuming 1rem = 16px)
  const spacingScale = {
    "0": 0, "0-5": 2, "1": 4, "1-5": 6, "2": 8, "2-5": 10, "3": 12, "3-5": 14, "4": 16,
    "5": 20, "6": 24, "7": 28, "8": 32, "9": 36, "10": 40, "11": 44, "12": 48,
    "14": 56, "16": 64, "20": 80, "24": 96, "28": 112, "32": 128, "36": 144, "40": 160,
    "44": 176, "48": 192, "52": 208, "56": 224, "60": 240, "64": 256, "72": 288, "80": 320, "96": 384
  };

  for (const key in spacingScale) {
    const name = `Sizes/${key}`;
    const value = spacingScale[key];
    await createFloatVariable(name, value, collectionId);
  }
}

async function createTypeSizeVariables(collectionId) {
  // Tailwind Typography Scale (font-size only)
  const typeScale = {
    "xs": 12, "sm": 14, "base": 16, "lg": 18, "xl": 20,
    "2xl": 24, "3xl": 30, "4xl": 36, "5xl": 48, "6xl": 60,
    "7xl": 72, "8xl": 96, "9xl": 128
  };

  const variables = {};
  for (const key in typeScale) {
    const name = `Type Sizes/${key}`;
    const value = typeScale[key];
    const variable = await createFloatVariable(name, value, collectionId);
    variables[key] = variable;
  }
  return variables;
}

async function createFloatVariable(name, value, collectionId) {
  const variables = await figma.variables.getLocalVariablesAsync();
  let variable = variables.find(v => v.name === name && v.variableCollectionId === collectionId);

  // Get the collection to access mode
  const collection = await figma.variables.getVariableCollectionByIdAsync(collectionId);
  const modeId = collection.modes[0].modeId;

  if (!variable) {
    // Pass collection object instead of collectionId
    variable = figma.variables.createVariable(name, collection, "FLOAT");
  }

  variable.setValueForMode(modeId, value);

  return variable;
}

async function createStringVariable(name, value, collectionId) {
  const variables = await figma.variables.getLocalVariablesAsync();
  let variable = variables.find(v => v.name === name && v.variableCollectionId === collectionId);

  // Get the collection to access mode
  const collection = await figma.variables.getVariableCollectionByIdAsync(collectionId);
  const modeId = collection.modes[0].modeId;

  if (!variable) {
    // Pass collection object instead of collectionId
    variable = figma.variables.createVariable(name, collection, "STRING");
  }

  variable.setValueForMode(modeId, value);

  return variable;
}

async function createTypographyVariables(collectionId) {
  console.log("Creating Typography variables (Font Family & Weight)...");

  // Font Family variables (STRING)
  const fontFamilies = {
    "Headings": "Inter",
    "Body": "Inter"
  };

  // Font Weight variables (NUMBER - 100 to 900)
  const fontWeights = {
    "Regular": 400,
    "Medium": 500,
    "Semi Bold": 600,
    "Bold": 700
  };

  // Font Style variables (STRING - the actual style name in the font)
  const fontStyles = {
    "Regular": "Regular",
    "Medium": "Medium",
    "Semi Bold": "Semi Bold",
    "Bold": "Bold"
  };

  const variables = { families: {}, weights: {}, styles: {} };

  // Create Font Family variables (STRING)
  for (const key in fontFamilies) {
    const name = `Typography/Font Family/${key}`;
    const value = fontFamilies[key];
    const variable = await createStringVariable(name, value, collectionId);
    variables.families[key] = variable;
  }

  // Create Font Weight variables (NUMBER)
  for (const key in fontWeights) {
    const name = `Typography/Font Weight/${key}`;
    const value = fontWeights[key];
    const variable = await createFloatVariable(name, value, collectionId);
    variables.weights[key] = variable;
  }

  // Create Font Style variables (STRING)
  for (const key in fontStyles) {
    const name = `Typography/Font Style/${key}`;
    const value = fontStyles[key];
    const variable = await createStringVariable(name, value, collectionId);
    variables.styles[key] = variable;
  }

  console.log("✅ Typography variables created");
  return variables;
}

// ==============================================================
// CLEANUP: Remove previous style guide artifacts
// ==============================================================
async function cleanupPreviousStyleGuide() {
  console.log("🧹 Cleaning up previous style guide...");

  try {
    // 1. Remove pages
    const pageNames = ["Mood board", "Color palette", "Type scale"];
    pageNames.forEach(pageName => {
      const page = figma.root.children.find(p => p.name === pageName);
      if (page) {
        console.log(`  Removing page: ${pageName}`);
        page.remove();
      }
    });

    // 2. Remove Variable Collections
    const collectionNames = ["Viiibe Primitives", "Viiibe Semantic"];
    const collections = await figma.variables.getLocalVariableCollectionsAsync();

    for (const collection of collections) {
      if (collectionNames.includes(collection.name)) {
        console.log(`  Removing variable collection: ${collection.name}`);

        // First, get all variables in this collection
        const variables = collection.variableIds.map(id => figma.variables.getVariableById(id));

        // Remove all variables in the collection
        for (const variable of variables) {
          if (variable) {
            variable.remove();
          }
        }

        // Then remove the collection itself
        // Note: Collections are automatically removed when all their variables are removed
      }
    }

    // 3. Remove Text Styles
    const localStyles = figma.getLocalTextStyles();
    const viibeStyles = localStyles.filter(style => style.name.startsWith("Viiibe/"));

    viibeStyles.forEach(style => {
      console.log(`  Removing text style: ${style.name}`);
      style.remove();
    });

    console.log("✅ Cleanup complete");
  } catch (error) {
    console.error("Error during cleanup:", error);
    // Don't throw - continue with generation even if cleanup fails
  }
}

async function createSemanticCollection(colorPrimitives) {
  const collection = await getOrCreateCollection("Viiibe Semantic");

  // Define semantic mappings
  // We map semantic roles to specific primitive shades
  const mappings = {
    "primary": colorPrimitives["Primary"]["500"],
    "primary-foreground": colorPrimitives["Primary"]["50"],
    "secondary": colorPrimitives["Secondary"]["500"],
    "secondary-foreground": colorPrimitives["Secondary"]["50"],
    "accent": colorPrimitives["Accent"]["500"],
    "accent-foreground": colorPrimitives["Accent"]["50"],
    "background": colorPrimitives["Neutral"]["50"],
    "foreground": colorPrimitives["Neutral"]["950"],
    "muted": colorPrimitives["Neutral"]["100"],
    "muted-foreground": colorPrimitives["Neutral"]["500"],
    "border": colorPrimitives["Neutral"]["200"],
    "input": colorPrimitives["Neutral"]["200"],
    "ring": colorPrimitives["Primary"]["500"]
  };

  for (const name in mappings) {
    if (mappings[name]) {
      const primitiveVariable = mappings[name];
      // Create alias
      const alias = { type: "VARIABLE_ALIAS", id: primitiveVariable.id };
      await createColorVariable(name, alias, collection.id);
    }
  }
}

async function createTypographyStyles(typeSizes, typography) {
  console.log("[createTypographyStyles] Starting... typeSizes:", typeSizes);
  console.log("[createTypographyStyles] Typography variables:", typography);

  // Define styles configuration
  // Structure: Category -> Style Name -> { size, weight, lineHeight, spacing }
  const styles = {
    "Display": {
      "Display 2xl": { size: "7xl", weight: "Bold", lineHeight: 1.1, spacing: -2 },
      "Display xl": { size: "6xl", weight: "Bold", lineHeight: 1.1, spacing: -2 },
      "Display lg": { size: "5xl", weight: "Bold", lineHeight: 1.1, spacing: -2 },
      "Display md": { size: "4xl", weight: "Bold", lineHeight: 1.1, spacing: -2 },
      "Display sm": { size: "3xl", weight: "Bold", lineHeight: 1.1, spacing: -2 },
      "Display xs": { size: "2xl", weight: "Bold", lineHeight: 1.1, spacing: -2 }
    },
    "Heading": {
      "H1": { size: "xl", weight: "Semi Bold", lineHeight: 1.2, spacing: -1 },
      "H2": { size: "lg", weight: "Semi Bold", lineHeight: 1.2, spacing: -1 },
      "H3": { size: "base", weight: "Semi Bold", lineHeight: 1.2, spacing: -1 },
      "H4": { size: "sm", weight: "Semi Bold", lineHeight: 1.2, spacing: -1 },
      "H5": { size: "xs", weight: "Semi Bold", lineHeight: 1.2, spacing: -1 }
    },
    "Body": {
      "Body xl": { size: "xl", weight: "Regular", lineHeight: 1.5, spacing: 0 },
      "Body lg": { size: "lg", weight: "Regular", lineHeight: 1.5, spacing: 0 },
      "Body md": { size: "base", weight: "Regular", lineHeight: 1.5, spacing: 0 },
      "Body sm": { size: "sm", weight: "Regular", lineHeight: 1.5, spacing: 0 },
      "Body xs": { size: "xs", weight: "Regular", lineHeight: 1.5, spacing: 0 }
    },
    "Label": {
      "Label xl": { size: "xl", weight: "Medium", lineHeight: 1.2, spacing: 0 },
      "Label lg": { size: "lg", weight: "Medium", lineHeight: 1.2, spacing: 0 },
      "Label md": { size: "base", weight: "Medium", lineHeight: 1.2, spacing: 0 },
      "Label sm": { size: "sm", weight: "Medium", lineHeight: 1.2, spacing: 0 },
      "Label xs": { size: "xs", weight: "Medium", lineHeight: 1.2, spacing: 0 }
    }
  };

  const existingStyles = figma.getLocalTextStyles();
  console.log("[createTypographyStyles] Existing text styles count:", existingStyles.length);

  for (const category in styles) {
    console.log(`[createTypographyStyles] Processing category: ${category}`);
    for (const styleName in styles[category]) {
      const config = styles[category][styleName];
      const fullName = `Viiibe/${category}/${styleName}`;
      console.log(`[createTypographyStyles] Creating style: ${fullName}, size: ${config.size}, weight: ${config.weight}`);

      let style = existingStyles.find(s => s.name === fullName);
      if (!style) {
        style = figma.createTextStyle();
        style.name = fullName;
        console.log(`[createTypographyStyles] ✅ Created new style: ${fullName}`);
      } else {
        console.log(`[createTypographyStyles] Reusing existing style: ${fullName}`);
      }

      // Load font before setting properties
      await figma.loadFontAsync({ family: "Inter", style: config.weight });

      // Determine which font family to use based on category
      const fontFamilyKey = (category === "Body") ? "Body" : "Headings";

      // Bind Font Family to Variable (STRING)
      const fontFamilyVar = typography.families[fontFamilyKey];
      if (fontFamilyVar) {
        console.log(`[createTypographyStyles] Binding ${fullName} fontFamily to variable: ${fontFamilyKey}`);
        style.setBoundVariable("fontFamily", fontFamilyVar);
      } else {
        console.error(`[createTypographyStyles] ❌ Font family variable not found: ${fontFamilyKey}`);
      }

      // Bind Font Weight to Variable (NUMBER)
      const fontWeightVar = typography.weights[config.weight];
      if (fontWeightVar) {
        console.log(`[createTypographyStyles] Binding ${fullName} fontWeight to variable: ${config.weight}`);
        style.setBoundVariable("fontWeight", fontWeightVar);
      } else {
        console.error(`[createTypographyStyles] ❌ Font weight variable not found: ${config.weight}`);
      }

      // Bind Font Style to Variable (STRING)
      const fontStyleVar = typography.styles[config.weight];
      if (fontStyleVar) {
        console.log(`[createTypographyStyles] Binding ${fullName} fontStyle to variable: ${config.weight}`);
        style.setBoundVariable("fontStyle", fontStyleVar);
      } else {
        console.error(`[createTypographyStyles] ❌ Font style variable not found: ${config.weight}`);
      }

      // Bind Font Size to Variable
      const fontSizeVar = typeSizes[config.size];
      if (fontSizeVar) {
        console.log(`[createTypographyStyles] Binding ${fullName} fontSize to variable: ${config.size}`);
        style.setBoundVariable("fontSize", fontSizeVar);
        console.log(`[createTypographyStyles] ✅ Bound successfully`);
      } else {
        console.error(`[createTypographyStyles] ❌ Variable not found for size: ${config.size}`);
        // Fallback if variable not found (shouldn't happen)
        style.fontSize = 16;
      }

      // Set other properties
      style.lineHeight = { value: config.lineHeight * 100, unit: "PERCENT" };
      style.letterSpacing = { value: config.spacing, unit: "PIXELS" };
    }
  }
}

// ============================================================
// GENERATOR: MOODBOARD
// ============================================================
async function generateMoodboard(images) {
  console.log("Generating moodboard with", images.length, "images");

  if (!images || !images.length) {
    console.log("No images to generate");
    return;
  }

  try {
    // 1. Crear o encontrar página
    let page = figma.root.children.find((p) => p.name === "Mood board");
    if (!page) {
      page = figma.createPage();
      page.name = "Mood board";
    }

    // 2. Limpiar página si tiene contenido
    const children = [...page.children];
    children.forEach(child => child.remove());

    // 3. Crear frame contenedor con autolayout
    const container = figma.createFrame();
    container.name = "Viiibe board";
    container.layoutMode = "VERTICAL";
    container.primaryAxisSizingMode = "AUTO";
    container.counterAxisSizingMode = "AUTO";
    container.paddingLeft = 80;
    container.paddingRight = 80;
    container.paddingTop = 80;
    container.paddingBottom = 80;
    container.itemSpacing = 60;
    container.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
    page.appendChild(container);

    // 4. Cargar fuente
    console.log("Loading font for moodboard...");
    await figma.loadFontAsync({ family: "Inter", style: "Bold" });
    console.log("Font loaded for moodboard!");

    // 5. Crear título y agregarlo al contenedor
    console.log("Creating moodboard title...");
    const title = figma.createText();
    title.fontName = { family: "Inter", style: "Bold" };
    title.characters = "Viiibe Board";
    title.fontSize = 80;
    container.appendChild(title);
    console.log("Moodboard title created!");

    // 6. Crear frame para la grilla de imágenes
    const gridFrame = figma.createFrame();
    gridFrame.name = "Image Grid";
    gridFrame.layoutMode = "NONE";
    gridFrame.fills = [];

    const COL = 4;
    const W = 500;
    const GAP = 40;
    const colHeights = Array(COL).fill(0);

    // 7. Crear imágenes y agregarlas a la grilla
    console.log("Creating images...");
    for (let i = 0; i < images.length; i++) {
      try {
        const img = images[i];
        let bytes;

        if (img.bytes instanceof Uint8Array) {
          bytes = img.bytes;
        } else if (Array.isArray(img.bytes)) {
          bytes = new Uint8Array(img.bytes);
        } else {
          bytes = new Uint8Array(Object.values(img.bytes));
        }

        const image = figma.createImage(bytes);
        const rect = figma.createRectangle();

        const w = img.width || 1000;
        const h = img.height || 1000;
        const aspect = h / w;
        const height = W * aspect;

        rect.resize(W, height);
        rect.fills = [
          { type: "IMAGE", imageHash: image.hash, scaleMode: "FIT" },
        ];

        const col = colHeights.indexOf(Math.min(...colHeights));
        rect.x = col * (W + GAP);
        rect.y = colHeights[col];
        colHeights[col] += height + GAP;

        gridFrame.appendChild(rect);
      } catch (err) {
        console.error("Error processing image", i, ":", err);
      }
    }

    // 8. Ajustar tamaño del frame de grilla y agregarlo al contenedor
    const maxHeight = Math.max(...colHeights);
    const gridWidth = COL * W + (COL - 1) * GAP;
    gridFrame.resize(gridWidth, maxHeight);
    container.appendChild(gridFrame);

    console.log("Moodboard generated with", gridFrame.children.length, "images");
  } catch (error) {
    console.error("Error in generateMoodboard:", error);
    throw error;
  }
}

// ============================================================
// GENERATOR: PALETTE
// ============================================================
async function generatePalette(colors, config = {}) {
  console.log("Generating palette page with Tailwind scales...");
  console.log("Config:", config);

  try {
    // Si no hay colores, usar paleta predeterminada
    if (!colors || !colors.length) {
      console.log("No colors collected, using default palette");
      colors = [
        { role: "Primary", hex: "#3b82f6" },
        { role: "Secondary", hex: "#8b5cf6" },
        { role: "Accent", hex: "#f59e0b" },
        { role: "Neutral", hex: "#6b7280" }
      ];
    }

    // Filtrar los colores base necesarios
    const baseRoles = ["Primary", "Secondary", "Accent", "Neutral"];
    let baseColors = colors.filter(c => baseRoles.includes(c.role));

    // Si faltan colores (ej. si viene de default), rellenar o usar lo que hay
    if (baseColors.length < baseRoles.length) {
      // Fallback simple: mapear los primeros 4 si no coinciden los roles
      const names = ["Primary", "Secondary", "Accent", "Neutral"];
      baseColors = colors.slice(0, 4).map((c, i) => ({
        role: names[i],
        hex: c.hex
      }));
    }

    // Generar escalas Tailwind para cada color
    console.log("Generating Tailwind scales...");
    const colorScales = {};
    baseColors.forEach(c => {
      if (c.role && c.hex) {
        colorScales[c.role] = generateColorScale(c.hex);
      }
    });

    // Variables para almacenar referencias (si se crean)
    let colorPrimitives = null;
    let typeSizes = null;
    let typography = null;

    // Crear Figma Variables SOLO si está habilitado
    if (config.createFigmaVariables) {
      console.log("Creating Figma Variables...");
      const result = await createPrimitivesCollection(colorScales);
      colorPrimitives = result.colorPrimitives;
      typeSizes = result.typeSizes;
      typography = result.typography;

      console.log("✅ Primitives collection created. Color primitives:", Object.keys(colorPrimitives));
      console.log("✅ Type sizes created:", Object.keys(typeSizes));
      console.log("✅ Typography variables created:", {
        families: Object.keys(typography.families),
        weights: Object.keys(typography.weights),
        styles: Object.keys(typography.styles)
      });

      await createSemanticCollection(colorPrimitives);
      console.log("✅ Semantic collection created");
    } else {
      console.log("⏭️ Skipping Figma Variables creation (disabled in config)");
    }

    // Crear Typography Styles SOLO si está habilitado
    if (config.createFigmaStyles && config.createFigmaVariables) {
      // Note: Typography styles require variables, so we only create them if both are enabled
      console.log("Creating Typography Styles...");
      await createTypographyStyles(typeSizes, typography);
      console.log("✅ Typography Styles created");
    } else {
      console.log("⏭️ Skipping Typography Styles creation (disabled in config or variables not created)");
    }

    // 3. Crear página y frame
    console.log("Creating Color palette page...");
    let page = figma.root.children.find((p) => p.name === "Color palette");
    if (!page) {
      page = figma.createPage();
      page.name = "Color palette";
      console.log("✅ Color palette page created");
    } else {
      console.log("Color palette page already exists, reusing");
    }

    // 2. Limpiar página si tiene contenido
    const children = [...page.children];
    children.forEach(child => child.remove());

    // 3. Crear frame contenedor con autolayout
    const container = figma.createFrame();
    container.name = "Viiibe Color Palette";
    container.layoutMode = "VERTICAL";
    container.primaryAxisSizingMode = "AUTO";
    container.counterAxisSizingMode = "AUTO";
    container.paddingLeft = 80;
    container.paddingRight = 80;
    container.paddingTop = 80;
    container.paddingBottom = 80;
    container.itemSpacing = 60;
    container.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
    page.appendChild(container);

    // 4. Cargar fuentes
    console.log("Loading fonts for palette...");
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    await figma.loadFontAsync({ family: "Inter", style: "Bold" });
    await figma.loadFontAsync({ family: "Inter", style: "Medium" });
    console.log("Fonts loaded for palette!");

    // 5. Crear título
    const title = figma.createText();
    title.fontName = { family: "Inter", style: "Bold" };
    title.characters = "Viiibe Color Palette";
    title.fontSize = 64;
    container.appendChild(title);

    // 6. Crear cada escala de color
    const shades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

    for (const colorName in colorScales) {
      const scale = colorScales[colorName];

      // Frame para esta escala
      const scaleFrame = figma.createFrame();
      scaleFrame.name = `${colorName} Scale`;
      scaleFrame.layoutMode = "VERTICAL";
      scaleFrame.primaryAxisSizingMode = "AUTO";
      scaleFrame.counterAxisSizingMode = "AUTO";
      scaleFrame.itemSpacing = 20;
      scaleFrame.fills = [];

      // Título de la escala
      const scaleTitle = figma.createText();
      scaleTitle.fontName = { family: "Inter", style: "Bold" };
      scaleTitle.characters = colorName;
      scaleTitle.fontSize = 32;
      scaleFrame.appendChild(scaleTitle);

      // Frame horizontal para los swatches
      const swatchesFrame = figma.createFrame();
      swatchesFrame.name = "Swatches";
      swatchesFrame.layoutMode = "HORIZONTAL";
      swatchesFrame.primaryAxisSizingMode = "AUTO";
      swatchesFrame.counterAxisSizingMode = "AUTO";
      swatchesFrame.itemSpacing = 8;
      swatchesFrame.fills = [];

      // Crear cada swatch
      shades.forEach(shade => {
        const swatchGroup = figma.createFrame();
        swatchGroup.name = shade;
        swatchGroup.layoutMode = "VERTICAL";
        swatchGroup.primaryAxisSizingMode = "AUTO";
        swatchGroup.counterAxisSizingMode = "AUTO";
        swatchGroup.itemSpacing = 8;
        swatchGroup.fills = [];

        // Rectángulo de color - usar valor directo (no variable)
        const rect = figma.createRectangle();
        rect.resize(80, 80);
        rect.fills = [{ type: "SOLID", color: hexToFigmaRgb(scale[shade]) }];
        rect.cornerRadius = 8;
        swatchGroup.appendChild(rect);

        // Label con el número del shade
        const shadeLabel = figma.createText();
        shadeLabel.fontName = { family: "Inter", style: "Medium" };
        shadeLabel.characters = shade;
        shadeLabel.fontSize = 14;
        shadeLabel.resize(80, shadeLabel.height);
        shadeLabel.textAlignHorizontal = "CENTER";
        swatchGroup.appendChild(shadeLabel);

        // Label con el hex
        const hexLabel = figma.createText();
        hexLabel.fontName = { family: "Inter", style: "Regular" };
        hexLabel.characters = scale[shade].toUpperCase();
        hexLabel.fontSize = 11;
        hexLabel.resize(80, hexLabel.height);
        hexLabel.textAlignHorizontal = "CENTER";
        hexLabel.fills = [{ type: "SOLID", color: { r: 0.5, g: 0.5, b: 0.5 } }];
        swatchGroup.appendChild(hexLabel);

        swatchesFrame.appendChild(swatchGroup);
      });

      scaleFrame.appendChild(swatchesFrame);
      container.appendChild(scaleFrame);
    }

    const message = config.createFigmaVariables
      ? "✅ Palette generated with Tailwind scales and Figma Variables!"
      : "✅ Palette generated with Tailwind scales (no variables)!";
    console.log(message);

    // Return variables for use in typography generation
    return { typeSizes, typography };
  } catch (error) {
    console.error("Error in generatePalette:", error);
    throw error;
  }
}

// ============================================================
// GENERATOR: TYPOGRAPHY
// ============================================================
async function generateTypography(items, config = {}) {
  console.log("Generating typography page...");
  console.log("Config:", config);

  try {
    // 1. Crear o encontrar página
    let page = figma.root.children.find((p) => p.name === "Type scale");
    if (!page) {
      page = figma.createPage();
      page.name = "Type scale";
    }

    // 2. Limpiar página si tiene contenido
    const children = [...page.children];
    children.forEach(child => child.remove());

    // 3. Crear frame contenedor con autolayout
    const container = figma.createFrame();
    container.name = "Viiibe Type Scale";
    container.layoutMode = "VERTICAL";
    container.primaryAxisSizingMode = "AUTO";
    container.counterAxisSizingMode = "AUTO";
    container.paddingLeft = 80;
    container.paddingRight = 80;
    container.paddingTop = 80;
    container.paddingBottom = 80;
    container.itemSpacing = 80;
    container.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
    page.appendChild(container);

    // 4. Cargar fuentes
    console.log("Loading fonts for typography...");
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    await figma.loadFontAsync({ family: "Inter", style: "Medium" });
    await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });
    await figma.loadFontAsync({ family: "Inter", style: "Bold" });
    console.log("Fonts loaded for typography!");

    // ============================================================
    // BLOQUE 1: HEADER (Título + Descripción)
    // ============================================================
    const headerFrame = figma.createFrame();
    headerFrame.name = "Header";
    headerFrame.layoutMode = "HORIZONTAL";
    headerFrame.primaryAxisSizingMode = "AUTO";
    headerFrame.counterAxisSizingMode = "AUTO";
    headerFrame.itemSpacing = 120;
    headerFrame.fills = [];

    // Título "Viiibe Type Scale"
    const mainTitle = figma.createText();
    mainTitle.fontName = { family: "Inter", style: "Bold" };
    mainTitle.characters = "Viiibe Type Scale";
    mainTitle.fontSize = 48;
    mainTitle.resize(300, mainTitle.height);
    headerFrame.appendChild(mainTitle);

    // Descripción
    const description = figma.createText();
    description.fontName = { family: "Inter", style: "Regular" };
    description.characters = "A well-defined type scale creates visual hierarchy and improves readability across your design system. It establishes consistent sizing, weights, and spacing that guide users through content naturally. Our type scale uses the Inter font family for its versatility and excellent legibility at all sizes.";
    description.fontSize = 14;
    description.lineHeight = { value: 24, unit: "PIXELS" };
    description.resize(500, description.height);
    headerFrame.appendChild(description);

    container.appendChild(headerFrame);

    // ============================================================
    // BLOQUE 2: TYPE SCALE VISUALIZATION
    // ============================================================
    const categories = ["Display", "Heading", "Body", "Label"];

    // Define type scale manually (for when styles are not created)
    const typeScaleDefinitions = {
      "Display": [
        { name: "Display 2xl", size: 72, weight: "Bold", lineHeight: 1.1 },
        { name: "Display xl", size: 60, weight: "Bold", lineHeight: 1.1 },
        { name: "Display lg", size: 48, weight: "Bold", lineHeight: 1.1 },
        { name: "Display md", size: 36, weight: "Bold", lineHeight: 1.1 },
        { name: "Display sm", size: 30, weight: "Bold", lineHeight: 1.1 },
        { name: "Display xs", size: 24, weight: "Bold", lineHeight: 1.1 }
      ],
      "Heading": [
        { name: "H1", size: 20, weight: "Semi Bold", lineHeight: 1.2 },
        { name: "H2", size: 18, weight: "Semi Bold", lineHeight: 1.2 },
        { name: "H3", size: 16, weight: "Semi Bold", lineHeight: 1.2 },
        { name: "H4", size: 14, weight: "Semi Bold", lineHeight: 1.2 },
        { name: "H5", size: 12, weight: "Semi Bold", lineHeight: 1.2 }
      ],
      "Body": [
        { name: "Body xl", size: 20, weight: "Regular", lineHeight: 1.5 },
        { name: "Body lg", size: 18, weight: "Regular", lineHeight: 1.5 },
        { name: "Body md", size: 16, weight: "Regular", lineHeight: 1.5 },
        { name: "Body sm", size: 14, weight: "Regular", lineHeight: 1.5 },
        { name: "Body xs", size: 12, weight: "Regular", lineHeight: 1.5 }
      ],
      "Label": [
        { name: "Label xl", size: 20, weight: "Medium", lineHeight: 1.2 },
        { name: "Label lg", size: 18, weight: "Medium", lineHeight: 1.2 },
        { name: "Label md", size: 16, weight: "Medium", lineHeight: 1.2 },
        { name: "Label sm", size: 14, weight: "Medium", lineHeight: 1.2 },
        { name: "Label xs", size: 12, weight: "Medium", lineHeight: 1.2 }
      ]
    };

    if (config.createFigmaStyles) {
      // Use existing Text Styles
      console.log("Using Text Styles for typography visualization");
      const localStyles = figma.getLocalTextStyles();

      for (const category of categories) {
        // Create Category Header
        const categoryHeader = figma.createText();
        categoryHeader.fontName = { family: "Inter", style: "Bold" };
        categoryHeader.characters = category;
        categoryHeader.fontSize = 24;
        categoryHeader.fills = [{ type: "SOLID", color: { r: 0.1, g: 0.1, b: 0.1 } }];
        container.appendChild(categoryHeader);

        // Create Frame for this category
        const categoryFrame = figma.createFrame();
        categoryFrame.name = category;
        categoryFrame.layoutMode = "VERTICAL";
        categoryFrame.primaryAxisSizingMode = "AUTO";
        categoryFrame.counterAxisSizingMode = "AUTO";
        categoryFrame.itemSpacing = 24;
        categoryFrame.fills = [];

        // Find styles for this category
        const categoryStyles = localStyles.filter(s => s.name.startsWith(`Viiibe/${category}/`));

        // Sort styles by font size descending
        categoryStyles.sort((a, b) => b.fontSize - a.fontSize);

        for (const style of categoryStyles) {
          const row = figma.createFrame();
          row.layoutMode = "HORIZONTAL";
          row.counterAxisAlignItems = "CENTER";
          row.itemSpacing = 40;
          row.fills = [];

          // 1. Info Column (Name + Specs)
          const infoCol = figma.createFrame();
          infoCol.layoutMode = "VERTICAL";
          infoCol.itemSpacing = 4;
          infoCol.fills = [];
          infoCol.resize(200, 100);
          infoCol.primaryAxisSizingMode = "AUTO";

          const styleName = figma.createText();
          styleName.fontName = { family: "Inter", style: "Semi Bold" };
          styleName.characters = style.name.split("/").pop();
          styleName.fontSize = 14;
          infoCol.appendChild(styleName);

          const specs = figma.createText();
          specs.fontName = { family: "Inter", style: "Regular" };
          specs.characters = `${style.fontSize}px / ${style.lineHeight.unit === "PERCENT" ? style.lineHeight.value + "%" : style.lineHeight.value + "px"}`;
          specs.fontSize = 12;
          specs.fills = [{ type: "SOLID", color: { r: 0.5, g: 0.5, b: 0.5 } }];
          infoCol.appendChild(specs);

          row.appendChild(infoCol);

          // 2. Preview Column (using style)
          const preview = figma.createText();
          preview.textStyleId = style.id;
          preview.characters = "The quick brown fox jumps over the lazy dog";
          row.appendChild(preview);

          categoryFrame.appendChild(row);
        }

        container.appendChild(categoryFrame);

        // Add spacer
        const spacer = figma.createRectangle();
        spacer.resize(100, 40);
        spacer.opacity = 0;
        container.appendChild(spacer);
      }
    } else {
      // Use direct values (no styles)
      console.log("Using direct values for typography visualization (no styles)");

      for (const category of categories) {
        // Create Category Header
        const categoryHeader = figma.createText();
        categoryHeader.fontName = { family: "Inter", style: "Bold" };
        categoryHeader.characters = category;
        categoryHeader.fontSize = 24;
        categoryHeader.fills = [{ type: "SOLID", color: { r: 0.1, g: 0.1, b: 0.1 } }];
        container.appendChild(categoryHeader);

        // Create Frame for this category
        const categoryFrame = figma.createFrame();
        categoryFrame.name = category;
        categoryFrame.layoutMode = "VERTICAL";
        categoryFrame.primaryAxisSizingMode = "AUTO";
        categoryFrame.counterAxisSizingMode = "AUTO";
        categoryFrame.itemSpacing = 24;
        categoryFrame.fills = [];

        const definitions = typeScaleDefinitions[category];

        for (const def of definitions) {
          const row = figma.createFrame();
          row.layoutMode = "HORIZONTAL";
          row.counterAxisAlignItems = "CENTER";
          row.itemSpacing = 40;
          row.fills = [];

          // 1. Info Column (Name + Specs)
          const infoCol = figma.createFrame();
          infoCol.layoutMode = "VERTICAL";
          infoCol.itemSpacing = 4;
          infoCol.fills = [];
          infoCol.resize(200, 100);
          infoCol.primaryAxisSizingMode = "AUTO";

          const styleName = figma.createText();
          styleName.fontName = { family: "Inter", style: "Semi Bold" };
          styleName.characters = def.name;
          styleName.fontSize = 14;
          infoCol.appendChild(styleName);

          const specs = figma.createText();
          specs.fontName = { family: "Inter", style: "Regular" };
          specs.characters = `${def.size}px / ${Math.round(def.lineHeight * 100)}%`;
          specs.fontSize = 12;
          specs.fills = [{ type: "SOLID", color: { r: 0.5, g: 0.5, b: 0.5 } }];
          infoCol.appendChild(specs);

          row.appendChild(infoCol);

          // 2. Preview Column (using direct values)
          const preview = figma.createText();
          preview.fontName = { family: "Inter", style: def.weight };
          preview.fontSize = def.size;
          preview.lineHeight = { value: def.lineHeight * 100, unit: "PERCENT" };
          preview.characters = "The quick brown fox jumps over the lazy dog";
          row.appendChild(preview);

          categoryFrame.appendChild(row);
        }

        container.appendChild(categoryFrame);

        // Add spacer
        const spacer = figma.createRectangle();
        spacer.resize(100, 40);
        spacer.opacity = 0;
        container.appendChild(spacer);
      }
    }

    const message = config.createFigmaStyles
      ? "✅ Typography page generated with Text Styles"
      : "✅ Typography page generated with direct values (no styles)";
    console.log(message);
  } catch (error) {
    console.error("Error in generateTypography:", error);
    throw error;
  }
}

// ==============================================================
// LOGIN CHECK
// ==============================================================
figma.clientStorage.getAsync("pinterest_token").then((token) => {
  console.log("Checking for existing token:", token ? "Found" : "Not found");
  figma.ui.postMessage({
    type: "show-view",
    view: token ? "search" : "auth",
  });
});

// ==============================================================
// MESSAGE HANDLER
// ==============================================================
figma.ui.onmessage = async (msg) => {
  console.log("Message received in code.js:", msg.type);

  // ------------------------------------------------------------
  // TOKEN MANUAL
  // ------------------------------------------------------------
  if (msg.type === "token-received") {
    console.log("Token received in code.js:", msg.token);
    await figma.clientStorage.setAsync("pinterest_token", msg.token);
    console.log("Token saved to clientStorage");
    figma.ui.postMessage({ type: "show-view", view: "search" });
    console.log("Sent show-view message to UI");
    return;
  }

  // ------------------------------------------------------------
  // CONNECT PINTEREST (with sessionId)
  // ------------------------------------------------------------
  if (msg.type === "connect-pinterest") {
    const sessionId = msg.sessionId || Math.random().toString(36).substring(2, 15);
    console.log("Opening auth window with sessionId:", sessionId);
    figma.ui.postMessage({
      type: "open-auth-window",
      url: `https://viiibe-backend-hce5.vercel.app/api/login?email=user@viiibe.app&state=${sessionId}`,
    });
    return;
  }

  // ------------------------------------------------------------
  // SMART SEARCH (NLP-based)
  // ------------------------------------------------------------
  if (msg.type === "smart-search") {
    const token = await figma.clientStorage.getAsync("pinterest_token");
    const query = msg.query || "";

    console.log("Smart search query:", query);

    // 1. Analyze the query using NLP
    const intent = analyzeSearchIntent(query);
    console.log("Extracted intent:", intent);

    // Progress: Step 2 - Mapping to boards
    figma.ui.postMessage({
      type: 'progress-update',
      step: 2
    });

    // 2. Map to relevant boards
    const relevantBoards = mapToBoards(intent);
    console.log("Relevant boards:", relevantBoards);
    console.log("Board names to search:", relevantBoards.map(function (b) { return b.name; }).join(", "));

    // 3. Search across ALL relevant boards using Pinterest API
    const allPins = [];
    const seenPinIds = new Set();

    for (let i = 0; i < relevantBoards.length; i++) {
      const boardConfig = relevantBoards[i];
      const boardName = boardConfig.name;

      console.log("Searching board:", boardName);

      // Find the board by name
      const board = await findBoardByName(boardName, token);

      if (!board) {
        console.log("Board not found:", boardName);
        continue;
      }

      console.log("Found board:", board.name, "ID:", board.id);

      // Fetch pins from this board
      const pins = await fetchBoardPins(board.id, token, 50);
      console.log("Fetched", pins.length, "pins from", board.name);

      // Add pins with relevance score and deduplicate
      for (let j = 0; j < pins.length; j++) {
        const pin = pins[j];
        if (!seenPinIds.has(pin.id)) {
          // Calculate dynamic score starting with board relevance
          let score = boardConfig.score;
          const text = ((pin.title || "") + " " + (pin.description || "")).toLowerCase();
          const title = (pin.title || "").toLowerCase();

          // DEBUG: Log text for first few pins to see what we are matching against
          if (j < 3) console.log("Pin text sample:", text);

          // EXACT MATCH BOOSTING (highest priority)
          // Check if query words appear in title (not just description)
          const queryWords = query.toLowerCase().split(' ');
          let exactMatches = 0;
          for (let k = 0; k < queryWords.length; k++) {
            if (queryWords[k].length > 2 && title.indexOf(queryWords[k]) !== -1) {
              exactMatches++;
            }
          }
          if (exactMatches > 0) {
            score += exactMatches * 0.5; // Boost for each exact word match in title
            console.log("EXACT MATCHES in title:", exactMatches, "for pin:", pin.id);
          }

          // Check colors (very high boost)
          for (let k = 0; k < intent.colors.length; k++) {
            const color = intent.colors[k];
            if (text.indexOf(color) !== -1) {
              score += 2.0; // SUPER HIGH boost for color match
              console.log("MATCHED COLOR:", color, "in pin:", pin.id, "New Score:", score);
            }
          }

          // Check styles (high boost)
          for (let k = 0; k < intent.styles.length; k++) {
            const style = intent.styles[k];
            if (text.indexOf(style) !== -1) {
              score += 1.0; // High boost for style
            }
          }

          // Check moods (medium boost)
          for (let k = 0; k < intent.moods.length; k++) {
            const mood = intent.moods[k];
            if (text.indexOf(mood) !== -1) {
              score += 0.8;
            }
          }

          // Check elements (medium boost)
          for (let k = 0; k < intent.elements.length; k++) {
            const element = intent.elements[k];
            if (text.indexOf(element) !== -1) {
              score += 0.7;
            }
          }

          // Check layouts (medium boost)
          for (let k = 0; k < intent.layouts.length; k++) {
            const layout = intent.layouts[k];
            if (text.indexOf(layout) !== -1) {
              score += 0.6;
            }
          }

          // Check project type (small boost)
          if (intent.projectType) {
            const pType = intent.projectType;
            if (text.indexOf(pType) !== -1) {
              score += 0.3;
            }
          }

          // NEGATIVE KEYWORD FILTERING (penalties)
          // Penalize pins that contain irrelevant content types
          const negativeKeywords = {
            // Design artifacts (not web/app UI)
            'poster': -3.0,
            'mockup': -3.0,
            'mock up': -3.0,
            'mock-up': -3.0,
            'flyer': -3.0,
            'brochure': -3.0,
            'business card': -3.0,
            'wallpaper': -3.0,

            // Branding/Identity (not UI)
            'logo': -2.5,
            'branding': -2.5,
            'brand identity': -3.0,
            'identity': -2.0,
            'packaging': -2.5,

            // Color/Typography samples (not UI)
            'palette': -3.0,
            'color palette': -3.0,
            'color scheme': -2.5,
            'typography': -2.0,
            'typeface': -2.0,
            'font': -1.5,

            // Other non-UI content
            'icon': -2.0,
            'illustration': -1.5,
            'background': -1.0,
            'template': -1.5,
            'pattern': -1.5,

            // Product/Physical items
            'product': -2.0,
            'bottle': -2.5,
            'package': -2.0,
            'box': -2.0
          };

          // Apply penalties for negative keywords
          const negativeKeys = Object.keys(negativeKeywords);
          for (let k = 0; k < negativeKeys.length; k++) {
            const keyword = negativeKeys[k];
            if (text.indexOf(keyword) !== -1) {
              score += negativeKeywords[keyword]; // Add negative value (penalty)
              console.log("PENALTY for", keyword, "in pin:", pin.id, "Penalty:", negativeKeywords[keyword]);
            }
          }

          // PROJECT TYPE VALIDATION (STRICT)
          // If user specified a project type, REQUIRE positive indicators
          if (intent.projectType) {
            const projectType = intent.projectType;
            let hasRequiredIndicator = false;

            // For landing pages/web projects, REQUIRE web indicators
            if (projectType === 'landing page' || projectType === 'saas' || projectType === 'portfolio' || projectType === 'blog') {
              const webIndicators = ['website', 'web', 'page', 'landing', 'homepage', 'ui', 'interface', 'site', 'online'];
              for (let k = 0; k < webIndicators.length; k++) {
                if (text.indexOf(webIndicators[k]) !== -1) {
                  hasRequiredIndicator = true;
                  break;
                }
              }

              // STRICT: If no web indicator AND has negative indicators, skip entirely
              if (!hasRequiredIndicator) {
                const strictNegatives = ['poster', 'logo', 'palette', 'color palette', 'branding', 'product', 'mockup'];
                for (let k = 0; k < strictNegatives.length; k++) {
                  if (text.indexOf(strictNegatives[k]) !== -1) {
                    console.log("SKIPPING pin (no web indicator + negative keyword):", pin.id);
                    continue; // Skip to next pin in outer loop
                  }
                }
                // Even without negative keywords, penalize heavily
                score -= 1.0;
              }
            }

            // For mobile app, REQUIRE mobile indicators
            if (projectType === 'mobile app') {
              const mobileIndicators = ['mobile', 'app', 'ios', 'android', 'phone', 'smartphone', 'application'];
              for (let k = 0; k < mobileIndicators.length; k++) {
                if (text.indexOf(mobileIndicators[k]) !== -1) {
                  hasRequiredIndicator = true;
                  break;
                }
              }

              if (!hasRequiredIndicator) {
                const strictNegatives = ['poster', 'logo', 'palette', 'branding', 'product'];
                for (let k = 0; k < strictNegatives.length; k++) {
                  if (text.indexOf(strictNegatives[k]) !== -1) {
                    console.log("SKIPPING pin (no mobile indicator + negative keyword):", pin.id);
                    continue;
                  }
                }
                score -= 1.0;
              }
            }

            // For dashboard, REQUIRE dashboard/analytics indicators
            if (projectType === 'dashboard') {
              const dashIndicators = ['dashboard', 'analytics', 'admin', 'panel', 'metrics', 'data', 'chart'];
              for (let k = 0; k < dashIndicators.length; k++) {
                if (text.indexOf(dashIndicators[k]) !== -1) {
                  hasRequiredIndicator = true;
                  break;
                }
              }

              if (!hasRequiredIndicator) {
                score -= 1.0;
              }
            }
          }

          // MINIMUM SCORE THRESHOLD
          // Don't include pins with very low scores (likely irrelevant)
          if (score < 0.6) {
            continue; // Skip this pin entirely
          }

          // Create new object preserving all original pin properties
          const pinWithScore = Object.assign({}, pin);
          pinWithScore.relevanceScore = score;
          pinWithScore.matchedBoard = board.name;

          allPins.push(pinWithScore);
          seenPinIds.add(pin.id);
        }
      }
    }

    // 4. Sort by relevance score (highest first)
    allPins.sort(function (a, b) { return b.relevanceScore - a.relevanceScore; });

    // DEBUG: Log top scores
    console.log("Top 5 scores:", allPins.slice(0, 5).map(function (p) { return p.relevanceScore; }));

    // Progress: Step 3 - Pins fetched and ranked
    figma.ui.postMessage({
      type: 'progress-update',
      step: 3
    });

    // 5. Take top 50 results (increased pool for visual filtering in UI)
    const topPins = allPins.slice(0, 50);

    console.log("Found " + allPins.length + " total pins, returning top " + topPins.length);

    // 6. Send results to UI
    figma.ui.postMessage({
      type: "show-view",
      view: "moodboard",
      data: {
        pins: topPins,
        category: query, // Clean title, just the query
        intent: intent
      },
    });

    return;
  }

  // ------------------------------------------------------------
  // GLOBAL SEARCH (Search all of Pinterest)
  // ------------------------------------------------------------
  if (msg.type === "global-search") {
    const token = await figma.clientStorage.getAsync("pinterest_token");
    const query = msg.query || "";

    console.log("🌍 Global Pinterest search query:", query);

    // Progress: Step 1 - Starting search
    figma.ui.postMessage({
      type: 'progress-update',
      step: 1
    });

    // Search Pinterest globally
    const pins = await searchPinterestGlobally(query, token, 50);
    console.log("Found", pins.length, "pins from global search");

    // Progress: Step 3 - Pins fetched
    figma.ui.postMessage({
      type: 'progress-update',
      step: 3
    });

    // Send results to UI
    figma.ui.postMessage({
      type: "show-view",
      view: "moodboard",
      data: {
        pins: pins,
        category: query,
        intent: { projectType: 'global search' }
      },
    });

    return;
  }

  // ------------------------------------------------------------
  // FETCH PINS
  // ------------------------------------------------------------
  if (msg.type === "get-pins") {
    const token = await figma.clientStorage.getAsync("pinterest_token");

    const res = await fetch(
      "https://viiibe-backend-hce5.vercel.app/api/get-pins",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: msg.category,
          token: token || "",
        }),
      }
    );

    if (!res.ok) return;

    const json = await res.json();
    const pins = Array.isArray(json) ? json : json.data || [];

    figma.ui.postMessage({
      type: "show-view",
      view: "moodboard",
      data: { pins: pins, category: msg.category },
    });

    return;
  }

  // ------------------------------------------------------------
  // FETCH IMAGE BY PROXY
  // ------------------------------------------------------------
  if (msg.type === "fetch-image") {
    console.log("Fetching image:", msg.url);
    try {
      // Use Vercel image proxy to bypass Pinterest CORS restrictions
      const proxyUrl = 'https://viiibe-backend-hce5.vercel.app/api/image-proxy?url=' + encodeURIComponent(msg.url);
      const res = await fetch(proxyUrl);
      console.log("Image fetch response status:", res.status);

      const buf = await res.arrayBuffer();
      console.log("Image loaded, size:", buf.byteLength, "bytes");

      figma.ui.postMessage({
        type: "image-loaded",
        target: msg.target,
        url: msg.url,
        imageBytes: new Uint8Array(buf),
      });

      console.log("Image message sent to UI");
    } catch (e) {
      console.error("Error fetching image:", msg.url, e);
      // If direct fetch fails, send error message
      figma.ui.postMessage({
        type: "image-error",
        target: msg.target,
        url: msg.url,
      });
    }
    return;
  }

  // ============================================================
  // FAB: FULL STYLEGUIDE GENERATOR
  // ============================================================
  if (msg.type === "generate-full-styleguide") {
    console.log("Starting style guide generation...");
    console.log("Received data:", {
      images: (msg.images && msg.images.length) || 0,
      colors: (msg.palette && msg.palette.length) || 0,
      typography: (msg.typography && msg.typography.length) || 0,
      config: msg.config
    });

    const images = msg.images || [];
    const colors = msg.palette || [];
    const typography = msg.typography || [];
    const config = msg.config || {
      downloadMoodboard: true,
      downloadColorPalette: true,
      downloadTypeScale: true,
      createFigmaStyles: false,
      createFigmaVariables: false,
      createBasicComponents: false
    };

    figma.notify("Generating style guide…");

    // Clean up previous style guide artifacts
    await cleanupPreviousStyleGuide();

    // Generate Moodboard if enabled
    if (config.downloadMoodboard) {
      try {
        console.log("Generating moodboard...");
        await generateMoodboard(images);
      } catch (error) {
        console.error("Error generating moodboard:", error);
        figma.notify("Error generating moodboard");
      }
    } else {
      console.log("Skipping moodboard (disabled in config)");
    }

    // Generate Palette if enabled
    if (config.downloadColorPalette) {
      try {
        console.log("Generating palette...");
        await generatePalette(colors, config);
      } catch (error) {
        console.error("Error generating palette:", error);
        figma.notify("Error generating palette");
      }
    } else {
      console.log("Skipping palette (disabled in config)");
    }

    // Generate Typography if enabled
    if (config.downloadTypeScale) {
      try {
        console.log("Generating typography...");
        await generateTypography(typography, config);
      } catch (error) {
        console.error("Error generating typography:", error);
        figma.notify("Error generating typography");
      }
    } else {
      console.log("Skipping typography (disabled in config)");
    }

    try {
      // Navigate to the first generated page
      let targetPage = null;
      if (config.downloadMoodboard) {
        targetPage = figma.root.children.find((p) => p.name === "Mood board");
      } else if (config.downloadColorPalette) {
        targetPage = figma.root.children.find((p) => p.name === "Color palette");
      } else if (config.downloadTypeScale) {
        targetPage = figma.root.children.find((p) => p.name === "Type scale");
      }

      if (targetPage) {
        figma.currentPage = targetPage;
      }

      figma.notify("Style guide generated!");
      console.log("Style guide generation complete!");

      // Close plugin after a brief delay
      setTimeout(() => {
        figma.closePlugin();
      }, 1000);
    } catch (error) {
      console.error("Error during finalization of style guide generation:", error);
      figma.notify("Error during finalization");
    }
  }
};