// AI Model Configuration
export const AI_MODELS = {
  GEMINI: 'gemini-2.0-flash-lite',
} as const;

// Extension Configuration
export const EXTENSION_CONFIG = {
  SEARCH_WINDOW: {
    WIDTH: 500,
    HEIGHT: 200,
  },
} as const;

// Message Types
export const MESSAGE_TYPES = {
  GROUP_TABS: 'GROUP_TABS',
  SEARCH_QUERY: 'SEARCH_QUERY',
  SHOW_API_KEY_ERROR: 'SHOW_API_KEY_ERROR',
} as const;

// Default Values
export const DEFAULTS = {
  GROUPING_METHOD: 'thematic',
  IS_ENABLED: true,
  MAX_SEARCH_RESULTS: 5,
} as const;

// Search Configuration
export const SEARCH_CONFIG = {
  MAX_RELEVANCE_SCORE: 100,
  MIN_RELEVANCE_SCORE: 0,
  FALLBACK_SCORES: {
    TITLE_MATCH: 50,
    HOSTNAME_MATCH: 30,
    URL_MATCH: 20,
  },
} as const;