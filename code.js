// ==============================================================
// MOOD! — BACKEND FINAL (COMPATIBLE)
// ==============================================================

// Import centralized configuration
const API_BASE_URL = 'https://moood-refactor.vercel.app/api';
const PROXY_URL = `${API_BASE_URL}/pinterest-proxy`;
const CURATED_BOARDS_URL = `${API_BASE_URL}/curated-boards`;
const SAVED_PINS_URL = `${API_BASE_URL}/pins`;

figma.showUI(__html__, { width: 720, height: 760, title: "Viiibe" });

// ==============================================================
// NLP SEARCH MODULE
// ==============================================================

// Keyword dictionaries for entity extraction
const NLP_KEYWORDS = {
  industries: {
    'Finance': ['finance', 'bank', 'banking', 'financial', 'fintech', 'investment', 'trading', 'stock', 'crypto', 'wallet', 'payment'],
    'Healthcare': ['healthcare', 'health', 'medical', 'hospital', 'clinic', 'doctor', 'medicine', 'wellness', 'therapy'],
    'Ecommerce': ['ecommerce', 'e-commerce', 'shop', 'store', 'retail', 'shopping', 'marketplace', 'cart', 'checkout', 'product'],
    'Education': ['education', 'learning', 'course', 'school', 'university', 'training', 'academy', 'student', 'teacher'],
    'Real Estate': ['real estate', 'property', 'house', 'home', 'apartment', 'realty', 'housing', 'rent', 'buy home'],
    'Tech': ['tech', 'technology', 'software', 'digital', 'cloud', 'ai', 'ml', 'startup', 'innovation'],
    'Saas': ['saas', 'software as a service', 'platform', 'web app', 'webapp', 'cloud software'],
    'Food': ['food', 'restaurant', 'cafe', 'bakery', 'dining', 'culinary', 'recipe', 'cooking', 'chef'],
    'Fashion': ['fashion', 'clothing', 'apparel', 'style', 'boutique', 'wear', 'outfit', 'wardrobe'],
    'Travel': ['travel', 'tourism', 'hotel', 'vacation', 'trip', 'destination', 'booking', 'flight'],
    'NGO': ['ngo', 'nonprofit', 'charity', 'foundation', 'social', 'community', 'volunteer', 'cause'],
    'Portfolio': ['portfolio', 'personal', 'freelance', 'creative', 'designer', 'developer', 'artist'],
    'Fitness': ['fitness', 'gym', 'workout', 'exercise', 'training', 'health club', 'wellness', 'sports'],
    'Agriculture': ['agriculture', 'farming', 'farm', 'organic', 'crops', 'harvest', 'rural', 'agro'],
    'Logistics': ['logistics', 'shipping', 'delivery', 'transport', 'freight', 'courier', 'warehouse', 'supply chain'],
    'Furniture': ['furniture', 'furnishing', 'interior', 'decor', 'home decor', 'sofa', 'table', 'chair'],
    'Consulting': ['consulting', 'consultant', 'advisory', 'strategy', 'business consulting', 'management'],
    'Business': ['business', 'corporate', 'enterprise', 'company', 'professional services'],
    'Sustainability': ['sustainability', 'sustainable', 'green', 'eco', 'environment', 'renewable', 'climate'],
    'Construction': ['construction', 'building', 'contractor', 'architecture', 'engineering', 'renovation'],
    'Beauty': ['beauty', 'cosmetics', 'salon', 'spa', 'makeup', 'skincare', 'haircare', 'aesthetics'],
    'Transportation': ['transportation', 'transport', 'mobility', 'transit', 'automotive', 'vehicle'],
    'Digital Agency': ['digital agency', 'agency', 'marketing agency', 'creative agency', 'advertising', 'branding'],
    'Home Services': ['home services', 'home service', 'cleaning', 'maintenance', 'repair', 'handyman', 'plumbing']
  },
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
    'blue': ['blue', 'azul', 'navy', 'cobalt', 'sky'],
    'cyan': ['cyan', 'turquoise', 'teal', 'aqua'],
    'green': ['green', 'verde', 'emerald', 'forest'],
    'lime': ['lime', 'lime green', 'bright green', 'neon green'],
    'yellow': ['yellow', 'amarillo', 'gold', 'golden', 'sunshine'],
    'orange': ['orange', 'naranja', 'tangerine', 'coral'],
    'purple': ['purple', 'morado', 'violet', 'lavender', 'plum'],
    'pink': ['pink', 'rosa', 'magenta', 'fuchsia', 'rose'],
    'black': ['black', 'negro', 'dark', 'oscuro'],
    'white': ['white', 'blanco', 'light', 'claro'],
    'gray': ['gray', 'grey', 'gris', 'silver', 'neutral'],
    'brown': ['brown', 'marrón', 'tan', 'earth', 'chocolate'],
    'beige': ['beige', 'cream', 'ivory', 'off-white', 'sand'],
    'colorful': ['colorful', 'multicolor', 'rainbow', 'multi-color', 'vibrant colors']
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
let cachedCuratedBoards = null;
let curatedBoardsTimestamp = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// ==============================================================
// PINTEREST API HELPERS (via Vercel Proxy)
// ==============================================================



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
 * Fetch curated boards from The Curator API
 * @returns {Array} - Array of curated board objects
 */
async function fetchCuratedBoards() {
  // Check cache first
  if (cachedCuratedBoards && curatedBoardsTimestamp) {
    const now = Date.now();
    if (now - curatedBoardsTimestamp < CACHE_DURATION) {
      console.log("📚 Using cached curated boards");
      return cachedCuratedBoards;
    }
  }

  try {
    console.log("📚 Fetching curated boards from API...");
    const response = await fetch(CURATED_BOARDS_URL);

    if (!response.ok) {
      console.error("Failed to fetch curated boards:", response.status);
      return [];
    }

    const data = await response.json();
    const boards = data.boards || [];

    // Cache the results
    cachedCuratedBoards = boards;
    curatedBoardsTimestamp = Date.now();

    console.log(`📚 Fetched ${boards.length} curated boards`);
    return boards;
  } catch (error) {
    console.error("Error fetching curated boards:", error);
    return [];
  }
}

/**
 * Search user's saved pins using the search API
 * @param {string} searchTerm - Search query
 * @param {string} token - Pinterest access token
 * @param {number} limit - Maximum number of results (default 50)
 * @returns {Array} - Array of pins from search
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
        action: 'search-user-pins',
        searchTerm: searchTerm,
        token: token,
        limit: limit
      })
    });

    if (!response.ok) {
      console.error("❌ Failed to search user pins:", response.status);
      const errorData = await response.json();
      console.error("Error response:", JSON.stringify(errorData, null, 2));
      return [];
    }

    const data = await response.json();
    console.log("📦 User pins search response:", data.items ? data.items.length + " pins found" : "0 pins");
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
 * Search saved pins from Vercel KV database
 * @param {string} query - Search query
 * @param {Object} intent - Parsed search intent from NLP
 * @param {boolean} randomize - Whether to randomize results (for reload)
 * @returns {Array} - Array of matching pins with scores
 */
async function searchSavedPins(query, intent, randomize = false) {
  try {
    console.log("🔍 Searching saved pins for:", query);

    // Build API URL with color filter if present
    let apiUrl = SAVED_PINS_URL;
    if (intent && intent.colors && intent.colors.length > 0) {
      // Use the first color for API filtering
      const primaryColor = intent.colors[0];
      apiUrl = `${SAVED_PINS_URL}?color=${primaryColor}`;
      console.log(`🎨 Using API color filter: ${primaryColor}`);
    }

    const response = await fetch(apiUrl);

    if (!response.ok) {
      console.error("❌ Failed to fetch saved pins:", response.status);
      return [];
    }

    const data = await response.json();
    const allPins = data.pins || [];
    console.log(`📦 Retrieved ${allPins.length} saved pins from database`);

    if (allPins.length === 0) {
      return [];
    }

    // Early exit: if query has no recognizable keywords and no intent, return empty immediately
    const queryWords = query.toLowerCase().split(' ').filter(w => w.length > 2);
    const hasIntent = intent && (intent.industry || intent.projectType || intent.styles.length > 0 || intent.colors.length > 0);

    if (!hasIntent && queryWords.length === 0) {
      console.log('⚠️ Query has no valid keywords - returning empty results immediately');
      return [];
    }

    // Score and filter pins based on query and intent
    const scoredPins = [];

    for (let i = 0; i < allPins.length; i++) {
      const pin = allPins[i];
      let score = 0;

      const title = (pin.title || '').toLowerCase();
      const description = (pin.description || '').toLowerCase();
      const text = title + ' ' + description;

      // CRITICAL: Filter by industry FIRST if specified
      if (intent && intent.industry) {
        const pinIndustries = pin.aiAnalysis && pin.aiAnalysis.industry ? pin.aiAnalysis.industry : [];
        const hasIndustryMatch = pinIndustries.some(ind =>
          ind.toLowerCase() === intent.industry.toLowerCase()
        );

        // Skip pins that don't match the specified industry
        if (!hasIndustryMatch) {
          continue; // Skip this pin entirely
        }

        // Give massive boost for industry match
        score += 10.0;
      }

      // Match against query words
      const queryWords = query.toLowerCase().split(' ').filter(w => w.length > 2);
      for (let j = 0; j < queryWords.length; j++) {
        if (title.indexOf(queryWords[j]) !== -1) {
          score += 1.0; // Higher score for title match
        } else if (text.indexOf(queryWords[j]) !== -1) {
          score += 0.3; // Lower score for description match
        }
      }

      // Match against intent - styles (INCREASED WEIGHT)
      if (intent && intent.styles) {
        for (let j = 0; j < intent.styles.length; j++) {
          const style = intent.styles[j];
          // Check in aiAnalysis.style array first (more reliable)
          if (pin.aiAnalysis && pin.aiAnalysis.style && Array.isArray(pin.aiAnalysis.style)) {
            for (let k = 0; k < pin.aiAnalysis.style.length; k++) {
              const pinStyle = pin.aiAnalysis.style[k].toLowerCase();
              if (pinStyle === style.toLowerCase() || pinStyle.includes(style.toLowerCase())) {
                score += 5.0; // HIGH boost for AI style match
                break;
              }
            }
          }
          // Fallback: also check text for style mentions
          if (text.indexOf(style) !== -1) {
            score += 2.0;
          }
        }
      }

      // Match against intent - colors (look in aiAnalysis.color, not text)
      if (intent && intent.colors && intent.colors.length > 0) {
        console.log(`🎨 Searching for colors:`, intent.colors);
        for (let j = 0; j < intent.colors.length; j++) {
          const intentColor = intent.colors[j].toLowerCase();

          // Check aiAnalysis.color array (from AI analysis)
          if (pin.aiAnalysis && pin.aiAnalysis.color && Array.isArray(pin.aiAnalysis.color)) {
            for (let k = 0; k < pin.aiAnalysis.color.length; k++) {
              const pinColor = pin.aiAnalysis.color[k].toLowerCase();
              if (pinColor === intentColor) {
                score += 3.0; // High boost for AI color match
                console.log(`✅ Color match: ${pinColor} === ${intentColor} for pin ${pin.id}`);
                break;
              }
            }
          }

          // Fallback: also check text for color mentions
          if (text.indexOf(intentColor) !== -1) {
            score += 1.0;
          }
        }
      }

      // Match against intent - project type
      if (intent && intent.projectType) {
        if (text.indexOf(intent.projectType) !== -1) {
          score += 1.8;
        }
      }

      // Match against intent - moods
      if (intent && intent.moods) {
        for (let j = 0; j < intent.moods.length; j++) {
          const mood = intent.moods[j];
          if (text.indexOf(mood) !== -1) {
            score += 0.8;
          }
        }
      }

      // Match against intent - elements
      if (intent && intent.elements) {
        for (let j = 0; j < intent.elements.length; j++) {
          const element = intent.elements[j];
          if (text.indexOf(element) !== -1) {
            score += 0.7;
          }
        }
      }

      // Only include pins with some relevance
      if (score > 0) {
        scoredPins.push(Object.assign({}, pin, {
          score: score,
          // Transform to expected format
          id: pin.id || pin.pinId,
          image: pin.imageUrl || '',
          fullsizeUrl: pin.imageUrl || '',
          thumbnailUrl: pin.imageUrl || '',
          link: pin.pinterestUrl || ''
        }));
      }
    }

    // Sort by score (highest first)
    scoredPins.sort((a, b) => b.score - a.score);

    // If randomize flag is true, shuffle the results before limiting
    if (randomize && scoredPins.length > 20) {
      console.log('🎲 Randomizing results for variety...');
      // Fisher-Yates shuffle
      for (let i = scoredPins.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [scoredPins[i], scoredPins[j]] = [scoredPins[j], scoredPins[i]];
      }
    }

    // Limit to 60 pins maximum (for pre-fetch optimization - frontend shows 20 at a time)
    const limitedPins = scoredPins.slice(0, 60);

    // Pre-validate and fix URLs to ensure 100% load success
    // Convert /originals/ to /736x/ since many /originals/ URLs return 403
    limitedPins.forEach(pin => {
      if (pin.image && pin.image.includes('/originals/')) {
        const originalUrl = pin.image;
        pin.image = pin.image.replace('/originals/', '/736x/');
        console.log(`🔄 Pre-validated URL: /originals/ → /736x/`);
        console.log(`   Pin ${pin.id}: ${originalUrl.substring(0, 60)}...`);
      }
    });


    console.log(`✅ Found ${scoredPins.length} matching pins, returning top ${limitedPins.length} (all URLs validated${randomize ? ', randomized' : ''})`);
    return limitedPins;

  } catch (error) {
    console.error("❌ Error searching saved pins:", error);
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
    industry: null,
    projectType: null,
    styles: [],
    colors: [],
    moods: [],
    elements: [],
    layouts: [],
    rawQuery: query
  };

  // Extract industry (first match wins)
  const industryKeys = Object.keys(NLP_KEYWORDS.industries);
  for (let i = 0; i < industryKeys.length; i++) {
    const industry = industryKeys[i];
    const keywords = NLP_KEYWORDS.industries[industry];
    let found = false;
    for (let j = 0; j < keywords.length; j++) {
      if (lowerQuery.indexOf(keywords[j]) !== -1) {
        found = true;
        break;
      }
    }
    if (found) {
      intent.industry = industry;
      break;
    }
  }

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

// Get descriptive color name from hex
function getColorNameFromHex(hex) {
  const rgb = hexToFigmaRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  // Determine base color from hue
  const h = hsl.h;
  const s = hsl.s;
  const l = hsl.l;

  // Achromatic colors
  if (s < 10) {
    if (l < 20) return "Black";
    if (l > 90) return "White";
    if (l < 40) return "Charcoal";
    if (l > 70) return "Silver";
    return "Gray";
  }

  // Chromatic colors
  if (h < 15 || h >= 345) return "Red";
  if (h < 45) return "Orange";
  if (h < 70) return "Yellow";
  if (h < 150) return "Green";
  if (h < 200) return "Cyan";
  if (h < 260) return "Blue";
  if (h < 290) return "Purple";
  if (h < 345) return "Pink";

  return "Color";
}

function rgbToHsl(r, g, b) {
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
    h: h * 360,
    s: s * 100,
    l: l * 100
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
  const modeId = collection.modes[0].modeId;

  // Get existing variables ONCE before the loop (optimization)
  const existingVariables = await figma.variables.getLocalVariablesAsync();
  const existingVarMap = {};
  existingVariables.forEach(v => {
    if (v.variableCollectionId === collection.id) {
      existingVarMap[v.name] = v;
    }
  });

  // 1. COLORS
  console.log("Creating Color Primitives...");
  for (const colorName in colorScales) {
    const scale = colorScales[colorName];
    primitives[colorName] = {};

    for (const shade in scale) {
      const variableName = `Color/${colorName}/${shade}`;
      const rgb = hexToFigmaRgb(scale[shade]);

      // Check if variable exists
      let variable = existingVarMap[variableName];
      if (!variable) {
        variable = figma.variables.createVariable(variableName, collection, "COLOR");
      }
      variable.setValueForMode(modeId, rgb);
      primitives[colorName][shade] = variable;
    }
  }

  console.log("✅ Color primitives created");

  // Return structure with only color variables (typography disabled)
  return {
    colorPrimitives: primitives,
    typeSizes: {},
    typography: { families: {}, weights: {}, styles: {} }
  };
}

async function createSizeVariables(collectionId) {
  // Reduced Tailwind Spacing Scale - only essential sizes
  const spacingScale = {
    "0": 0, "1": 4, "2": 8, "3": 12, "4": 16,
    "6": 24, "8": 32, "12": 48, "16": 64, "24": 96
  };

  for (const key in spacingScale) {
    const name = `Sizes/${key}`;
    const value = spacingScale[key];
    await createFloatVariable(name, value, collectionId);
  }
}

async function createTypeSizeVariables(collectionId) {
  // Complete Typography Scale - matching createTypographyStyles requirements
  const typeScale = {
    "xs": 12,
    "sm": 14,
    "base": 16,
    "lg": 18,
    "xl": 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
    "5xl": 48,
    "6xl": 60,
    "7xl": 72
  };

  const variables = {};
  for (const key in typeScale) {
    const name = `Type Size/${key}`;
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

  // Simplified Font Family variables (STRING)
  const fontFamilies = {
    "Headings": "Inter",
    "Body": "Inter"
  };

  // Simplified Font Weight variables (NUMBER)
  const fontWeights = {
    "Regular": 400,
    "Bold": 700
  };

  const variables = { families: {}, weights: {} };

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

async function createTypographyStyles() {
  console.log("[createTypographyStyles] Starting...");

  // Size mappings - direct pixel values (no variable binding to avoid memory issues)
  const sizeMap = {
    "xs": 12, "sm": 14, "base": 16, "lg": 18, "xl": 20,
    "2xl": 24, "3xl": 30, "4xl": 36, "5xl": 48, "6xl": 60, "7xl": 72
  };

  // Define styles configuration
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
      "H1": { size: "5xl", weight: "Bold", lineHeight: 1.2, spacing: -1 },
      "H2": { size: "4xl", weight: "Bold", lineHeight: 1.2, spacing: -1 },
      "H3": { size: "3xl", weight: "Bold", lineHeight: 1.2, spacing: -1 },
      "H4": { size: "2xl", weight: "Medium", lineHeight: 1.2, spacing: -1 },
      "H5": { size: "xl", weight: "Medium", lineHeight: 1.2, spacing: -1 },
      "H6": { size: "lg", weight: "Medium", lineHeight: 1.2, spacing: -1 }
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

  let createdCount = 0;

  for (const category in styles) {
    console.log(`[createTypographyStyles] Processing category: ${category}`);
    for (const styleName in styles[category]) {
      const config = styles[category][styleName];
      const fullName = `Viiibe!/${category}/${styleName}`;

      let style = existingStyles.find(s => s.name === fullName);
      if (!style) {
        style = figma.createTextStyle();
        style.name = fullName;
        console.log(`[createTypographyStyles] ✅ Created: ${fullName}`);
        createdCount++;
      }

      // Load font before setting properties
      await figma.loadFontAsync({ family: "Inter", style: config.weight });

      // Set ALL properties directly (no variable binding to avoid memory issues)
      style.fontName = { family: "Inter", style: config.weight };
      style.fontSize = sizeMap[config.size] || 16;
      style.lineHeight = { value: config.lineHeight * 100, unit: "PERCENT" };
      style.letterSpacing = { value: config.spacing, unit: "PIXELS" };
    }
  }

  console.log(`[createTypographyStyles] ✅ Complete! Created ${createdCount} new styles`);
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
    const children = Array.from(page.children);
    children.forEach(child => child.remove());

    // 3. Crear frame contenedor con autolayout
    const container = figma.createFrame();
    container.name = "Viiibe! board";
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
    title.characters = "Viiibe! Board";
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

        const col = colHeights.indexOf(Math.min.apply(Math, colHeights));
        rect.x = col * (W + GAP);
        rect.y = colHeights[col];
        colHeights[col] += height + GAP;

        gridFrame.appendChild(rect);
      } catch (err) {
        console.error("Error processing image", i, ":", err);
      }
    }

    // 8. Ajustar tamaño del frame de grilla y agregarlo al contenedor
    const maxHeight = Math.max.apply(Math, colHeights);
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
  console.log("Received colors from frontend:", colors);

  try {
    // Si no hay colores, usar paleta predeterminada
    if (!colors || !colors.length) {
      console.log("No colors collected, using default palette");
      colors = [
        { role: "Primary", hex: "#3b82f6" },
        { role: "Secondary", hex: "#8b5cf6" },
        { role: "Tertiary", hex: "#10b981" },
        { role: "Accent", hex: "#f59e0b" },
        { role: "Neutral", hex: "#6b7280" }
      ];
    }

    console.log("📥 Received colors from frontend:", colors);

    // Use the 4 colors from the UI: Primary, Secondary, Tertiary (shown as Tertiary in UI), Accent
    const baseColors = [];

    // Map colors by role
    colors.forEach(c => {
      if (c.role === 'Primary') {
        baseColors.push({ role: "Primary", hex: c.hex, name: c.name });
        console.log(`✅ Primary: ${c.hex} (${c.name})`);
      } else if (c.role === 'Secondary') {
        baseColors.push({ role: "Secondary", hex: c.hex, name: c.name });
        console.log(`✅ Secondary: ${c.hex} (${c.name})`);
      } else if (c.role === 'Tertiary') {
        baseColors.push({ role: "Tertiary", hex: c.hex, name: c.name });
        console.log(`✅ Tertiary: ${c.hex} (${c.name})`);
      } else if (c.role === 'Accent') {
        baseColors.push({ role: "Accent", hex: c.hex, name: c.name });
        console.log(`✅ Accent: ${c.hex} (${c.name})`);
      }
    });

    console.log("🎨 Final colors for Tailwind scales:", baseColors);
    console.log("🎨 Final colors:", baseColors);

    // Generar escalas Tailwind para cada color
    console.log("Generating Tailwind scales...");
    const colorScales = {};
    baseColors.forEach(c => {
      if (c.role && c.hex) {
        console.log(`Creating scale for ${c.role}: ${c.hex}`);
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
        weights: Object.keys(typography.weights)
      });

      // SEMANTIC COLLECTION TEMPORARILY DISABLED - causes memory errors
      // await createSemanticCollection(colorPrimitives);
      console.log("⏭️ Skipping Semantic collection (disabled due to memory issues)");
    } else {
      console.log("⏭️ Skipping Figma Variables creation (disabled in config)");
    }

    // Typography Styles TEMPORARILY DISABLED
    // (Typography variables are disabled due to memory issues)
    console.log("⏭️ Skipping Typography Styles creation (typography variables disabled)");

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
    const children = Array.from(page.children);
    children.forEach(child => child.remove());

    // 3. Crear frame contenedor con autolayout
    const container = figma.createFrame();
    container.name = "Viiibe! Color Palette";
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

    // 5. Crear título principal
    const mainTitle = figma.createText();
    mainTitle.fontName = { family: "Inter", style: "Bold" };
    mainTitle.characters = "Color palette";
    mainTitle.fontSize = 32;
    mainTitle.fills = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }];
    container.appendChild(mainTitle);

    // ========================================
    // SECTION 1: LARGE COLOR SWATCHES (MOCKUP LAYOUT)
    // ========================================
    // Layout: Primary (500x500) | Secondary (250x500) | [Tertiary (250x250) / Accent (250x250)]

    const largeSwatchesFrame = figma.createFrame();
    largeSwatchesFrame.name = "Large Swatches";
    largeSwatchesFrame.layoutMode = "HORIZONTAL";
    largeSwatchesFrame.primaryAxisSizingMode = "AUTO";
    largeSwatchesFrame.counterAxisSizingMode = "AUTO";
    largeSwatchesFrame.itemSpacing = 0;
    largeSwatchesFrame.fills = [];
    container.appendChild(largeSwatchesFrame);

    // Get colors array (should have role, hex, and name from frontend)
    const colorsArray = baseColors; // baseColors comes from the filtered colors sent by frontend
    console.log(`Creating mockup layout with ${colorsArray.length} colors`);

    // Helper function to create a color swatch
    function createColorSwatch(colorData, width, height) {
      const { role, hex, name } = colorData;
      console.log(`Creating ${width}x${height} swatch for ${role}: ${hex} (name: ${name || 'undefined'})`);

      const swatchContainer = figma.createFrame();
      swatchContainer.name = role;
      swatchContainer.resize(width, height);
      swatchContainer.fills = [{ type: "SOLID", color: hexToFigmaRgb(hex) }];
      swatchContainer.layoutMode = "VERTICAL";
      swatchContainer.primaryAxisSizingMode = "FIXED";
      swatchContainer.counterAxisSizingMode = "FIXED";
      swatchContainer.primaryAxisAlignItems = "MAX";
      swatchContainer.counterAxisAlignItems = "MIN";
      swatchContainer.paddingLeft = 30;
      swatchContainer.paddingRight = 30;
      swatchContainer.paddingTop = 30;
      swatchContainer.paddingBottom = 30;

      // Determine text color based on background
      const rgb = hexToFigmaRgb(hex);
      const yiq = ((rgb.r * 299) + (rgb.g * 587) + (rgb.b * 114)) / 1000;
      const textColor = yiq >= 0.5 ? { r: 0, g: 0, b: 0 } : { r: 1, g: 1, b: 1 };

      // Role label (14px, Medium)
      const roleLabel = figma.createText();
      roleLabel.fontName = { family: "Inter", style: "Medium" };
      roleLabel.characters = role;
      roleLabel.fontSize = 14;
      roleLabel.fills = [{ type: "SOLID", color: textColor, opacity: 0.7 }];
      swatchContainer.appendChild(roleLabel);

      // Color name (20px, Medium)
      const colorNameLabel = figma.createText();
      colorNameLabel.fontName = { family: "Inter", style: "Medium" };
      colorNameLabel.characters = name || getColorNameFromHex(hex);
      colorNameLabel.fontSize = 20;
      colorNameLabel.fills = [{ type: "SOLID", color: textColor }];
      swatchContainer.appendChild(colorNameLabel);

      // Hex label (14px, Medium)
      const hexLabel = figma.createText();
      hexLabel.fontName = { family: "Inter", style: "Medium" };
      hexLabel.characters = hex.toUpperCase();
      hexLabel.fontSize = 14;
      hexLabel.fills = [{ type: "SOLID", color: textColor, opacity: 0.7 }];
      swatchContainer.appendChild(hexLabel);

      return swatchContainer;
    }

    // Primary: 500x500
    if (colorsArray[0]) {
      const primarySwatch = createColorSwatch(colorsArray[0], 500, 500);
      largeSwatchesFrame.appendChild(primarySwatch);
    }

    // Secondary: 250x500
    if (colorsArray[1]) {
      const secondarySwatch = createColorSwatch(colorsArray[1], 250, 500);
      largeSwatchesFrame.appendChild(secondarySwatch);
    }

    // Tertiary & Accent: 250x250 stacked vertically
    if (colorsArray[2] || colorsArray[3]) {
      const rightColumn = figma.createFrame();
      rightColumn.name = "Right Column";
      rightColumn.layoutMode = "VERTICAL";
      rightColumn.primaryAxisSizingMode = "AUTO";
      rightColumn.counterAxisSizingMode = "AUTO";
      rightColumn.itemSpacing = 0;
      rightColumn.fills = [];

      if (colorsArray[2]) {
        const tertiarySwatch = createColorSwatch(colorsArray[2], 250, 250);
        rightColumn.appendChild(tertiarySwatch);
      }

      if (colorsArray[3]) {
        const accentSwatch = createColorSwatch(colorsArray[3], 250, 250);
        rightColumn.appendChild(accentSwatch);
      }

      largeSwatchesFrame.appendChild(rightColumn);
    }

    console.log(`✅ Completed mockup layout`);

    // ========================================
    // SECTION 2: COLOR SCALES
    // ========================================

    // Scales title
    const scalesTitle = figma.createText();
    scalesTitle.fontName = { family: "Inter", style: "Bold" };
    scalesTitle.characters = "Color scales";
    scalesTitle.fontSize = 32;
    scalesTitle.fills = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }];
    container.appendChild(scalesTitle);

    // All shades for Tailwind scales
    const allShades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

    for (const colorData of colorsArray) {
      const { role } = colorData;
      const scale = colorScales[role];

      // Row container for this color's scale
      const scaleRow = figma.createFrame();
      scaleRow.name = `${role} Scale`;
      scaleRow.layoutMode = "HORIZONTAL";
      scaleRow.primaryAxisSizingMode = "AUTO";
      scaleRow.counterAxisSizingMode = "AUTO";
      scaleRow.itemSpacing = 8;
      scaleRow.fills = [];

      // Create swatches for each shade
      allShades.forEach(shade => {
        const swatchGroup = figma.createFrame();
        swatchGroup.name = shade;
        swatchGroup.layoutMode = "VERTICAL";
        swatchGroup.primaryAxisSizingMode = "AUTO";
        swatchGroup.counterAxisSizingMode = "AUTO";
        swatchGroup.itemSpacing = 4;
        swatchGroup.fills = [];

        // Color rectangle
        const rect = figma.createRectangle();
        rect.resize(80, 80);
        rect.cornerRadius = 8;
        rect.fills = [{ type: "SOLID", color: hexToFigmaRgb(scale[shade]) }];
        swatchGroup.appendChild(rect);

        // Shade number label
        const shadeLabel = figma.createText();
        shadeLabel.fontName = { family: "Inter", style: "Medium" };
        shadeLabel.characters = shade;
        shadeLabel.fontSize = 12;
        shadeLabel.resize(80, shadeLabel.height);
        shadeLabel.textAlignHorizontal = "CENTER";
        shadeLabel.fills = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }];
        swatchGroup.appendChild(shadeLabel);

        // Hex label
        const hexLabel = figma.createText();
        hexLabel.fontName = { family: "Inter", style: "Regular" };
        hexLabel.characters = scale[shade].toUpperCase();
        hexLabel.fontSize = 10;
        hexLabel.resize(80, hexLabel.height);
        hexLabel.textAlignHorizontal = "CENTER";
        hexLabel.fills = [{ type: "SOLID", color: { r: 0.5, g: 0.5, b: 0.5 } }];
        swatchGroup.appendChild(hexLabel);

        scaleRow.appendChild(swatchGroup);
      });

      container.appendChild(scaleRow);
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
    // Create Text Styles (simplified version with direct values, no variable binding)
    if (config.createFigmaStyles) {
      console.log("Creating Typography Styles (direct values, no variable binding)...");
      await createTypographyStyles();
      console.log("✅ Typography Styles created successfully!");
    } else {
      console.log("⏭️ Skipping text styles creation (disabled in config)");
    }

    // 1. Crear o encontrar página
    let page = figma.root.children.find((p) => p.name === "Type scale");
    if (!page) {
      page = figma.createPage();
      page.name = "Type scale";
    }

    // 2. Limpiar página si tiene contenido
    const children = Array.from(page.children);
    children.forEach(child => child.remove());

    // 3. Crear frame contenedor con autolayout - matches .viiibe-type-scale with padding: 80px
    const container = figma.createFrame();
    container.name = "Viiibe! Type Scale";
    container.layoutMode = "VERTICAL";
    container.primaryAxisSizingMode = "AUTO";
    container.counterAxisSizingMode = "AUTO";
    container.paddingLeft = 80;
    container.paddingRight = 80;
    container.paddingTop = 80;
    container.paddingBottom = 80;
    container.itemSpacing = 60; // gap: 60px from CSS
    container.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
    page.appendChild(container);

    // 4. Cargar fuentes
    console.log("Loading fonts for typography...");
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    await figma.loadFontAsync({ family: "Inter", style: "Medium" });
    await figma.loadFontAsync({ family: "Inter", style: "Bold" });
    console.log("Fonts loaded for typography!");

    // ============================================================
    // BLOQUE 1: HEADER - matches .header with align-self: stretch
    // ============================================================
    const headerFrame = figma.createFrame();
    headerFrame.name = "Header";
    headerFrame.layoutMode = "HORIZONTAL";
    headerFrame.primaryAxisSizingMode = "AUTO";
    headerFrame.counterAxisSizingMode = "AUTO";
    headerFrame.itemSpacing = 0;
    headerFrame.primaryAxisAlignItems = "MIN";
    headerFrame.counterAxisAlignItems = "MIN";
    headerFrame.fills = [];

    // Título "Viiibe! Type Scale" - matches .text-wrapper with flex: 1
    const mainTitle = figma.createText();
    mainTitle.fontName = { family: "Inter", style: "Bold" };
    mainTitle.characters = "Viiibe! Type Scale";
    mainTitle.fontSize = 64; // font-size: 64px from CSS
    mainTitle.layoutGrow = 1; // flex: 1
    headerFrame.appendChild(mainTitle);

    // Spacer - matches .spacer with flex-grow: 1
    const spacer = figma.createFrame();
    spacer.name = "Spacer";
    spacer.layoutMode = "HORIZONTAL";
    spacer.layoutGrow = 1;
    spacer.resize(100, 100); // height: 100px from CSS
    spacer.fills = [];
    headerFrame.appendChild(spacer);

    // Descripción / Disclaimer - matches .div with width: 400px
    const description = figma.createText();
    description.fontName = { family: "Inter", style: "Regular" };
    description.characters = "Viiibe! cannot determine with precision the typography used in the moodboard images. This type scale is a contextual suggestion based on your search query, designed to complement the visual direction of your moodboard. The suggested font pairing is commonly used in similar projects and can serve as a starting point for your design system.";
    description.fontSize = 12;
    description.lineHeight = { value: 20, unit: "PIXELS" };
    description.resize(400, description.height);
    headerFrame.appendChild(description);

    container.appendChild(headerFrame);
    headerFrame.layoutSizingHorizontal = "FILL"; // Set AFTER appending to parent

    // Divider - matches .divider with align-self: stretch, width: 100%, height: 1px
    const divider = figma.createRectangle();
    divider.name = "Divider";
    divider.resize(100, 1); // Width will be overridden by layoutSizing
    divider.fills = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }];
    container.appendChild(divider);
    divider.layoutSizingHorizontal = "FILL"; // Set AFTER appending to parent

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
        { name: "H1", size: 48, weight: "Bold", lineHeight: 1.2 },
        { name: "H2", size: 36, weight: "Bold", lineHeight: 1.2 },
        { name: "H3", size: 30, weight: "Bold", lineHeight: 1.2 },
        { name: "H4", size: 24, weight: "Medium", lineHeight: 1.2 },
        { name: "H5", size: 20, weight: "Medium", lineHeight: 1.2 },
        { name: "H6", size: 18, weight: "Medium", lineHeight: 1.2 }
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

    // ALWAYS use direct values (text styles creation is disabled due to memory issues)
    // This bypasses the config.createFigmaStyles check since we can't create styles reliably
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
        const categoryStyles = localStyles.filter(s => s.name.startsWith(`Viiibe!/${category}/`));

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
          styleName.fontName = { family: "Inter", style: "Medium" };
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
          styleName.fontName = { family: "Inter", style: "Medium" };
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
// PLUGIN INITIALIZATION
// ==============================================================
// Always show search view - no authentication needed
figma.ui.postMessage({
  type: "show-view",
  view: "search",
});

// ==============================================================
// MESSAGE HANDLER
// ==============================================================
figma.ui.onmessage = async (msg) => {
  console.log("Message received in code.js:", msg.type);

  // OAuth handlers removed - plugin now uses saved pins from Vercel KV

  // ------------------------------------------------------------
  // SMART SEARCH (NLP-based) - Now searches saved pins from Vercel KV
  // ------------------------------------------------------------
  if (msg.type === "smart-search") {
    const query = msg.query || "";
    const reload = msg.reload || false; // Get reload flag from message

    console.log(`🔍 Smart search query: "${query}"${reload ? ' (reload)' : ''}`);

    // Progress: Step 1 - Analyzing query
    figma.ui.postMessage({
      type: 'progress-update',
      step: 1
    });

    // 1. Use intent from Mini-PRD if provided, otherwise analyze the query using NLP
    let intent;
    if (msg.intent && msg.intent.industry) {
      // Intent provided by Mini-PRD - use it directly
      intent = msg.intent;
      console.log("📊 Using Mini-PRD intent:", intent);
    } else {
      // No intent provided - analyze query with NLP
      intent = analyzeSearchIntent(query);
      console.log("📊 Extracted intent from query:", intent);
    }

    // Progress: Step 2 - Searching saved pins
    figma.ui.postMessage({
      type: 'progress-update',
      step: 2
    });

    // 2. Search saved pins from Vercel KV (with optional randomization)
    const results = await searchSavedPins(query, intent, reload);
    console.log(`✅ Found ${results.length} matching pins from saved collection`);

    // Early exit if no results
    if (results.length === 0) {
      console.log('⚠️ No results found - showing empty state');
      figma.ui.postMessage({
        type: 'show-view',
        view: 'moodboard',
        data: { pins: [], category: query, intent: intent }
      });
      return;
    }

    console.log(`✅ Found ${results.length} matching pins`);

    // Send results to UI and show moodboard immediately
    figma.ui.postMessage({
      type: 'show-view',
      view: 'moodboard',
      data: {
        pins: results,
        category: query,
        intent: intent
      }
    });

    return;
  }

  // Removed: global-search and get-pins handlers (now using saved pins only)


  // ------------------------------------------------------------
  // FETCH IMAGE BY PROXY
  // ------------------------------------------------------------
  if (msg.type === "fetch-image") {
    console.log("Fetching image:", msg.url);
    try {
      // Use Vercel image proxy to bypass Pinterest CORS restrictions
      const proxyUrl = 'https://viiibe-backend-nfueitpl1-alberto-contreras-projects-101c33ba.vercel.app/api/image-proxy?url=' + encodeURIComponent(msg.url);
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
      createFigmaStyles: true,  // Enable Text Styles creation
      createFigmaVariables: false,  // Disabled to avoid memory errors
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
      // Reorder pages: Mood board should be first among generated pages
      const moodboardPage = figma.root.children.find((p) => p.name === "Mood board");
      const colorPalettePage = figma.root.children.find((p) => p.name === "Color palette");
      const typeScalePage = figma.root.children.find((p) => p.name === "Type scale");

      // Find the index of the first generated page
      const existingPagesCount = figma.root.children.filter(
        (p) => !["Mood board", "Color palette", "Type scale"].includes(p.name)
      ).length;

      // Move pages in correct order: Mood board, Color palette, Type scale
      if (moodboardPage) {
        figma.root.insertChild(existingPagesCount, moodboardPage);
      }
      if (colorPalettePage) {
        figma.root.insertChild(existingPagesCount + 1, colorPalettePage);
      }
      if (typeScalePage) {
        figma.root.insertChild(existingPagesCount + 2, typeScalePage);
      }

      // Navigate to Mood board (or first available generated page)
      let targetPage = moodboardPage || colorPalettePage || typeScalePage;

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