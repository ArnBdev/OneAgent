// filepath: coreagent/types/webFetch.ts
// Type definitions for Web Fetch functionality

export interface WebFetchOptions {
  url: string;
  timeout?: number; // milliseconds, default 10000
  followRedirects?: boolean; // default true
  maxRedirects?: number; // default 5
  userAgent?: string; // custom user agent
  extractContent?: boolean; // extract and clean HTML content, default true
  extractMetadata?: boolean; // extract page metadata, default true
  validateUrl?: boolean; // validate URL before fetching, default true
}

export interface WebFetchResponse {
  url: string;
  finalUrl?: string; // after redirects
  statusCode: number;
  statusText: string;
  headers: Record<string, string>;
  content: WebFetchContent;
  metadata: WebFetchMetadata;
  fetchTime: number; // milliseconds
  timestamp: string;
  success: boolean;
  error?: string;
}

export interface WebFetchContent {
  raw: string; // original HTML/content
  text: string; // cleaned text content
  html?: string; // cleaned HTML (if HTML content)
  contentType: string; // MIME type
  encoding: string; // character encoding
  size: number; // content size in bytes
  wordCount?: number; // word count for text content
}

export interface WebFetchMetadata {
  title?: string;
  description?: string;
  keywords?: string[];
  author?: string;
  language?: string;
  canonical?: string;
  robots?: string;
  viewport?: string;

  // Open Graph metadata
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;
  ogSiteName?: string;

  // Twitter Card metadata
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterSite?: string;

  // Additional metadata
  favicon?: string;
  generator?: string;
  lastModified?: string;
  publishedTime?: string;
  modifiedTime?: string;
  images?: string[]; // extracted image URLs
  links?: string[]; // extracted link URLs
}

export interface WebFetchConfig {
  defaultTimeout: number;
  defaultUserAgent: string;
  maxRetries: number;
  retryDelay: number; // milliseconds
  maxContentSize: number; // bytes
  allowedContentTypes: string[];
  blockedDomains?: string[];
  rateLimit?: {
    requestsPerSecond: number;
    requestsPerMinute: number;
  };
}

export interface WebFetchError {
  code: string;
  message: string;
  url: string;
  statusCode?: number;
  details?: unknown;
  isRetryable?: boolean;
}

// Content extraction result for specific content types
export interface ContentExtractionResult {
  success: boolean;
  contentType: string;
  extractedData: unknown;
  confidence: number; // 0-1 confidence score
  processingTime: number;
  error?: string;
}
