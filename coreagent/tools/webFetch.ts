// filepath: coreagent/tools/webFetch.ts
// Web content fetching and extraction tool

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { JSDOM } from 'jsdom';
import { 
  WebFetchOptions, 
  WebFetchResponse, 
  WebFetchContent, 
  WebFetchMetadata,
  WebFetchConfig,
  WebFetchError,
  ContentExtractionResult
} from '../types/webFetch';

export class WebFetchTool {
  private client: AxiosInstance;
  private config: WebFetchConfig;
  private mockMode: boolean = false;
  private lastRequestTime: number = 0;
  private requestCount: number = 0;

  constructor(config?: Partial<WebFetchConfig>) {
    this.config = {
      defaultTimeout: 10000,
      defaultUserAgent: 'OneAgent-WebFetchTool/1.0 (https://github.com/oneagent)',
      maxRetries: 3,
      retryDelay: 1000,
      maxContentSize: 10 * 1024 * 1024, // 10MB
      allowedContentTypes: [
        'text/html',
        'text/plain',
        'text/xml',
        'application/xml',
        'application/json',
        'text/markdown',
        'text/css',
        'application/javascript',
        'text/javascript'
      ],
      rateLimit: {
        requestsPerSecond: 2,
        requestsPerMinute: 60
      },
      ...config
    };    // Enable mock mode in test environment or when specified
    this.mockMode = process.env.NODE_ENV === 'test' || (config?.defaultUserAgent?.includes('mock') ?? false);

    if (!this.mockMode) {
      this.client = axios.create({
        timeout: this.config.defaultTimeout,
        maxRedirects: 5,
        validateStatus: (status) => status < 500, // Don't throw on client errors (4xx)
        headers: {
          'User-Agent': this.config.defaultUserAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1', // Do Not Track
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });
    } else {
      console.log('🌐 WebFetchTool: Running in mock mode');
      // Create dummy client for mock mode
      this.client = axios.create();
    }
  }

  /**
   * Fetch content from a URL with full content extraction
   */
  async fetchContent(options: WebFetchOptions): Promise<WebFetchResponse> {
    const startTime = Date.now();
    
    try {
      if (this.mockMode) {
        return this.mockFetch(options);
      }

      // Validate URL if requested
      if (options.validateUrl !== false) {
        this.validateUrl(options.url);
      }

      // Enforce rate limiting
      await this.enforceRateLimit();

      console.log(`🌐 WebFetchTool: Fetching content from ${options.url}`);

      // Configure request options
      const requestConfig = {
        timeout: options.timeout || this.config.defaultTimeout,
        maxRedirects: options.maxRedirects || 5,
        ...(options.userAgent && { 
          headers: { 'User-Agent': options.userAgent } 
        })
      };

      const response: AxiosResponse = await this.client.get(options.url, requestConfig);
      
      // Check content size
      const contentLength = response.headers['content-length'];
      if (contentLength && parseInt(contentLength) > this.config.maxContentSize) {
        throw new Error(`Content too large: ${contentLength} bytes (max: ${this.config.maxContentSize})`);
      }

      // Check content type
      const contentType = response.headers['content-type'] || 'text/plain';
      if (!this.isAllowedContentType(contentType)) {
        console.warn(`⚠️ Content type ${contentType} not in allowed list, proceeding anyway`);
      }

      // Extract content
      const content = await this.extractContent(response.data, contentType, options);
      
      // Extract metadata (only for HTML content)
      const metadata = contentType.includes('text/html') && options.extractMetadata !== false
        ? await this.extractMetadata(response.data, options.url, response.request?.responseURL)
        : {};

      const fetchTime = Date.now() - startTime;

      const result: WebFetchResponse = {
        url: options.url,
        finalUrl: response.request?.responseURL || options.url,
        statusCode: response.status,
        statusText: response.statusText,
        headers: this.normalizeHeaders(response.headers),
        content,
        metadata,
        fetchTime,
        timestamp: new Date().toISOString(),
        success: true
      };

      console.log(`✅ WebFetchTool: Successfully fetched ${content.size} bytes in ${fetchTime}ms`);
      return result;

    } catch (error: any) {
      const fetchTime = Date.now() - startTime;
      console.error('❌ WebFetchTool error:', error.message);
      
      const webFetchError: WebFetchError = {
        code: error.code || 'FETCH_ERROR',
        message: error.message,
        url: options.url,
        statusCode: error.response?.status,
        details: error.response?.data
      };

      return {
        url: options.url,
        statusCode: error.response?.status || 0,
        statusText: error.response?.statusText || 'Error',
        headers: error.response ? this.normalizeHeaders(error.response.headers) : {},
        content: {
          raw: '',
          text: '',
          contentType: 'text/plain',
          encoding: 'utf-8',
          size: 0
        },
        metadata: {},
        fetchTime,
        timestamp: new Date().toISOString(),
        success: false,
        error: webFetchError.message
      };
    }
  }

  /**
   * Quick fetch - simplified interface for common use cases
   */
  async quickFetch(url: string, extractContent: boolean = true): Promise<WebFetchResponse> {
    return this.fetchContent({
      url,
      extractContent,
      extractMetadata: extractContent
    });
  }

  /**
   * Fetch multiple URLs concurrently (with rate limiting)
   */
  async fetchMultiple(urls: string[], options?: Partial<WebFetchOptions>): Promise<WebFetchResponse[]> {
    console.log(`🌐 WebFetchTool: Fetching ${urls.length} URLs concurrently`);
    
    const results: WebFetchResponse[] = [];
    
    // Process URLs in batches to respect rate limits
    const batchSize = Math.min(3, urls.length);
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const batchPromises = batch.map(url => 
        this.fetchContent({ url, ...options })
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map(result => 
        result.status === 'fulfilled' ? result.value : this.createErrorResponse(
          batch[batchResults.indexOf(result)], 
          result.reason
        )
      ));
      
      // Add delay between batches
      if (i + batchSize < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  /**
   * Test the web fetch functionality
   */
  async testFetch(): Promise<boolean> {
    try {
      console.log('🌐 Testing web fetch functionality...');
      
      const testResult = await this.quickFetch('https://httpbin.org/user-agent');
      const isWorking = testResult.success && testResult.content.size > 0;
      
      if (isWorking) {
        console.log('✅ Web fetch test passed');
      } else {
        console.log('⚠️ Web fetch test failed or returned no content');
      }
      
      return isWorking;
    } catch (error) {
      console.error('❌ Web fetch test failed:', error);
      return false;
    }
  }

  // PRIVATE HELPER METHODS

  /**
   * Validate URL format and security
   */
  private validateUrl(url: string): void {
    try {
      const urlObj = new URL(url);
      
      // Check protocol
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error(`Unsupported protocol: ${urlObj.protocol}`);
      }
      
      // Check for blocked domains
      if (this.config.blockedDomains?.some(domain => 
        urlObj.hostname.includes(domain)
      )) {
        throw new Error(`Domain ${urlObj.hostname} is blocked`);
      }
      
      // Prevent localhost access in production (security measure)
      if (process.env.NODE_ENV === 'production' && 
          ['localhost', '127.0.0.1', '::1'].includes(urlObj.hostname)) {
        throw new Error('Localhost access not allowed in production');
      }
      
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error(`Invalid URL format: ${url}`);
      }
      throw error;
    }
  }

  /**
   * Enforce rate limiting
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = 1000 / (this.config.rateLimit?.requestsPerSecond || 2);
    
    if (timeSinceLastRequest < minInterval) {
      const delay = minInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  /**
   * Check if content type is allowed
   */
  private isAllowedContentType(contentType: string): boolean {
    return this.config.allowedContentTypes.some(allowed => 
      contentType.toLowerCase().includes(allowed.toLowerCase())
    );
  }

  /**
   * Extract and clean content based on content type
   */
  private async extractContent(
    rawContent: string, 
    contentType: string, 
    options: WebFetchOptions
  ): Promise<WebFetchContent> {
    if (options.extractContent === false) {
      return {
        raw: rawContent,
        text: rawContent,
        contentType,
        encoding: 'utf-8',
        size: Buffer.byteLength(rawContent, 'utf8')
      };
    }

    let cleanText = rawContent;
    let cleanHtml: string | undefined;
    let wordCount: number | undefined;

    // HTML content extraction
    if (contentType.includes('text/html')) {
      try {
        const dom = new JSDOM(rawContent);
        const document = dom.window.document;
        
        // Remove script and style elements
        const scriptsAndStyles = document.querySelectorAll('script, style, noscript');
        scriptsAndStyles.forEach(element => element.remove());
        
        // Extract clean text
        cleanText = document.body?.textContent || document.textContent || '';
        cleanText = cleanText.replace(/\s+/g, ' ').trim();
        
        // Keep cleaned HTML
        cleanHtml = document.body?.innerHTML || document.documentElement.innerHTML;
        
        wordCount = cleanText.split(/\s+/).filter(word => word.length > 0).length;
        
      } catch (error) {
        console.warn('⚠️ HTML parsing failed, using raw content:', error);
        cleanText = rawContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      }
    }
    
    // JSON content
    else if (contentType.includes('application/json')) {
      try {
        const jsonData = JSON.parse(rawContent);
        cleanText = JSON.stringify(jsonData, null, 2);
      } catch (error) {
        console.warn('⚠️ JSON parsing failed, using raw content');
      }
    }
    
    // XML content  
    else if (contentType.includes('xml')) {
      // Basic XML cleaning - remove tags for text extraction
      cleanText = rawContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }    return {
      raw: rawContent,
      text: cleanText,
      ...(cleanHtml && { html: cleanHtml }),
      contentType,
      encoding: 'utf-8', // Assume UTF-8 for now
      size: Buffer.byteLength(rawContent, 'utf8'),
      ...(wordCount && { wordCount })
    };
  }

  /**
   * Extract metadata from HTML content
   */
  private async extractMetadata(
    htmlContent: string, 
    originalUrl: string, 
    finalUrl?: string
  ): Promise<WebFetchMetadata> {
    try {
      const dom = new JSDOM(htmlContent);
      const document = dom.window.document;
        const metadata: WebFetchMetadata = {};
      
      // Basic metadata - only assign if value exists
      const title = document.querySelector('title')?.textContent?.trim();
      if (title) metadata.title = title;
      
      const description = this.getMetaContent(document, 'description');
      if (description) metadata.description = description;
      
      const keywordsRaw = this.getMetaContent(document, 'keywords');
      if (keywordsRaw) metadata.keywords = keywordsRaw.split(',').map(k => k.trim());
      
      const author = this.getMetaContent(document, 'author');
      if (author) metadata.author = author;
      
      const language = document.documentElement.lang || this.getMetaContent(document, 'language');
      if (language) metadata.language = language;
      
      const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href');
      if (canonical) metadata.canonical = canonical;
      
      const robots = this.getMetaContent(document, 'robots');
      if (robots) metadata.robots = robots;
      
      const viewport = this.getMetaContent(document, 'viewport');
      if (viewport) metadata.viewport = viewport;
      
      // Open Graph metadata
      const ogTitle = this.getMetaProperty(document, 'og:title');
      if (ogTitle) metadata.ogTitle = ogTitle;
      
      const ogDescription = this.getMetaProperty(document, 'og:description');
      if (ogDescription) metadata.ogDescription = ogDescription;
      
      const ogImage = this.getMetaProperty(document, 'og:image');
      if (ogImage) metadata.ogImage = ogImage;
      
      const ogUrl = this.getMetaProperty(document, 'og:url');
      if (ogUrl) metadata.ogUrl = ogUrl;
      
      const ogType = this.getMetaProperty(document, 'og:type');
      if (ogType) metadata.ogType = ogType;
      
      const ogSiteName = this.getMetaProperty(document, 'og:site_name');
      if (ogSiteName) metadata.ogSiteName = ogSiteName;
      
      // Twitter Card metadata
      const twitterCard = this.getMetaName(document, 'twitter:card');
      if (twitterCard) metadata.twitterCard = twitterCard;
      
      const twitterTitle = this.getMetaName(document, 'twitter:title');
      if (twitterTitle) metadata.twitterTitle = twitterTitle;
      
      const twitterDescription = this.getMetaName(document, 'twitter:description');
      if (twitterDescription) metadata.twitterDescription = twitterDescription;
      
      const twitterImage = this.getMetaName(document, 'twitter:image');
      if (twitterImage) metadata.twitterImage = twitterImage;
      
      const twitterSite = this.getMetaName(document, 'twitter:site');
      if (twitterSite) metadata.twitterSite = twitterSite;
      
      // Additional metadata
      const favicon = this.extractFavicon(document, finalUrl || originalUrl);
      if (favicon) metadata.favicon = favicon;
      
      const generator = this.getMetaContent(document, 'generator');
      if (generator) metadata.generator = generator;
      
      const lastModified = this.getMetaContent(document, 'last-modified');
      if (lastModified) metadata.lastModified = lastModified;
      
      const publishedTime = this.getMetaProperty(document, 'article:published_time');
      if (publishedTime) metadata.publishedTime = publishedTime;
      
      const modifiedTime = this.getMetaProperty(document, 'article:modified_time');
      if (modifiedTime) metadata.modifiedTime = modifiedTime;
      
      // Extract images and links
      metadata.images = this.extractImages(document, finalUrl || originalUrl);
      metadata.links = this.extractLinks(document, finalUrl || originalUrl);
      
      return metadata;
      
    } catch (error) {
      console.warn('⚠️ Metadata extraction failed:', error);
      return {};
    }
  }

  /**
   * Get meta content by name
   */
  private getMetaContent(document: Document, name: string): string | undefined {
    return document.querySelector(`meta[name="${name}"]`)?.getAttribute('content') || undefined;
  }

  /**
   * Get meta content by property (for Open Graph)
   */
  private getMetaProperty(document: Document, property: string): string | undefined {
    return document.querySelector(`meta[property="${property}"]`)?.getAttribute('content') || undefined;
  }

  /**
   * Get meta content by name attribute (for Twitter Cards)
   */
  private getMetaName(document: Document, name: string): string | undefined {
    return document.querySelector(`meta[name="${name}"]`)?.getAttribute('content') || undefined;
  }

  /**
   * Extract favicon URL
   */
  private extractFavicon(document: Document, baseUrl: string): string | undefined {
    const selectors = [
      'link[rel="icon"]',
      'link[rel="shortcut icon"]', 
      'link[rel="apple-touch-icon"]'
    ];
    
    for (const selector of selectors) {
      const link = document.querySelector(selector);
      if (link) {
        const href = link.getAttribute('href');
        if (href) {
          return this.resolveUrl(href, baseUrl);
        }
      }
    }
    
    // Default favicon location
    try {
      const url = new URL(baseUrl);
      return `${url.protocol}//${url.host}/favicon.ico`;
    } catch {
      return undefined;
    }
  }

  /**
   * Extract image URLs from page
   */
  private extractImages(document: Document, baseUrl: string): string[] {
    const images = Array.from(document.querySelectorAll('img[src]'));
    return images
      .map(img => img.getAttribute('src'))
      .filter((src): src is string => !!src)
      .map(src => this.resolveUrl(src, baseUrl))
      .slice(0, 20); // Limit to first 20 images
  }

  /**
   * Extract link URLs from page
   */
  private extractLinks(document: Document, baseUrl: string): string[] {
    const links = Array.from(document.querySelectorAll('a[href]'));
    return links
      .map(link => link.getAttribute('href'))
      .filter((href): href is string => !!href)
      .filter(href => href.startsWith('http') || href.startsWith('/'))
      .map(href => this.resolveUrl(href, baseUrl))
      .slice(0, 50); // Limit to first 50 links
  }

  /**
   * Resolve relative URLs to absolute URLs
   */
  private resolveUrl(url: string, baseUrl: string): string {
    try {
      return new URL(url, baseUrl).href;
    } catch {
      return url;
    }
  }

  /**
   * Normalize response headers
   */
  private normalizeHeaders(headers: any): Record<string, string> {
    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      if (typeof value === 'string') {
        normalized[key.toLowerCase()] = value;
      }
    }
    return normalized;
  }

  /**
   * Create error response
   */
  private createErrorResponse(url: string, error: any): WebFetchResponse {
    return {
      url,
      statusCode: 0,
      statusText: 'Error',
      headers: {},
      content: {
        raw: '',
        text: '',
        contentType: 'text/plain',
        encoding: 'utf-8',
        size: 0
      },
      metadata: {},
      fetchTime: 0,
      timestamp: new Date().toISOString(),
      success: false,
      error: error.message || 'Unknown error'
    };
  }

  /**
   * Mock fetch implementation for development/testing
   */
  private mockFetch(options: WebFetchOptions): WebFetchResponse {
    console.log(`🌐 Mock fetch for: ${options.url}`);
    
    const mockHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Mock webpage content for OneAgent WebFetchTool testing">
    <meta property="og:title" content="Mock Page Title">
    <meta property="og:description" content="Mock webpage for testing WebFetchTool functionality">
    <title>Mock Page Title - OneAgent Test</title>
</head>
<body>
    <h1>Mock Page Content</h1>
    <p>This is mock content returned by WebFetchTool for URL: ${options.url}</p>
    <p>In production, this would be real webpage content fetched from the actual URL.</p>
    <a href="https://example.com/link1">Mock Link 1</a>
    <a href="https://example.com/link2">Mock Link 2</a>
    <img src="https://example.com/image1.jpg" alt="Mock Image 1">
</body>
</html>`;

    const mockContent: WebFetchContent = {
      raw: mockHtml,
      text: 'Mock Page Content This is mock content returned by WebFetchTool for URL: ' + options.url + ' In production, this would be real webpage content fetched from the actual URL.',
      html: '<h1>Mock Page Content</h1><p>This is mock content returned by WebFetchTool for URL: ' + options.url + '</p><p>In production, this would be real webpage content fetched from the actual URL.</p><a href="https://example.com/link1">Mock Link 1</a><a href="https://example.com/link2">Mock Link 2</a><img src="https://example.com/image1.jpg" alt="Mock Image 1">',
      contentType: 'text/html',
      encoding: 'utf-8',
      size: mockHtml.length,
      wordCount: 25
    };

    const mockMetadata: WebFetchMetadata = {
      title: 'Mock Page Title - OneAgent Test',
      description: 'Mock webpage content for OneAgent WebFetchTool testing',
      language: 'en',
      ogTitle: 'Mock Page Title',
      ogDescription: 'Mock webpage for testing WebFetchTool functionality',
      images: ['https://example.com/image1.jpg'],
      links: ['https://example.com/link1', 'https://example.com/link2']
    };

    return {
      url: options.url,
      finalUrl: options.url,
      statusCode: 200,
      statusText: 'OK',
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'content-length': mockHtml.length.toString()
      },
      content: mockContent,
      metadata: mockMetadata,
      fetchTime: 150, // Mock 150ms fetch time
      timestamp: new Date().toISOString(),
      success: true
    };
  }

  /**
   * Get tool configuration
   */
  getConfig() {
    return {
      provider: 'WebFetch',
      mockMode: this.mockMode,
      config: {
        ...this.config,
        // Don't expose sensitive data
        defaultUserAgent: this.config.defaultUserAgent
      }
    };
  }
}
