// filepath: coreagent/types/braveSearch.ts
// Type definitions for Brave Search API

export interface BraveSearchQuery {
  q: string; // The search query
  country?: string; // Country code (e.g., 'US', 'GB')
  safesearch?: 'strict' | 'moderate' | 'off';
  count?: number; // Number of results (max 20)
  offset?: number; // Offset for pagination
}

export interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
  age?: string; // How old the result is
  language?: string;
  family_friendly?: boolean;
}

export interface BraveSearchResponse {
  query: {
    original: string;
    show_strict_warning: boolean;
    is_navigational: boolean;
    is_geolocal: boolean;
    local_decision: string;
    local_locations_idx: number;
    is_trending: boolean;
    is_news_breaking: boolean;
    ask_for_location: boolean;
    language: {
      main: string;
      language_display: string;
    };
    spellcheck_off: boolean;
    country: string;
    bad_results: boolean;
    should_fallback: boolean;
    postal_code: string;
    city: string;
    header_country: string;
    more_results_available: boolean;
    custom_location_label: string;
    reddit_cluster: string;
  };
  mixed: {
    type: string;
    main: BraveSearchResult[];
    top: BraveSearchResult[];
    side: BraveSearchResult[];
  };
  web: {
    type: string;
    results: BraveSearchResult[];
    family_friendly: boolean;
  };
  videos?: {
    type: string;
    results: Array<{
      url: string;
      title: string;
      description: string;
      age: string;
      video: {
        duration: string;
        thumbnail: {
          src: string;
        };
      };
    }>;
  };
  news?: {
    type: string;
    results: Array<{
      url: string;
      title: string;
      description: string;
      age: string;
      breaking: boolean;
    }>;
  };
}

export interface BraveSearchConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
}

export interface BraveSearchError {
  code: string;
  message: string;
  details?: any;
}
