// ============================================================================
// LottieFiles Library Browser
// Search and browse animations from the LottieFiles public library
// ============================================================================

export interface LottieSearchResult {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  lottieUrl: string;
  gifUrl?: string;
  imageUrl?: string;
  bgColor?: string;
  author?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  tags?: string[];
}

export interface LottieAnimationData {
  id: string;
  name: string;
  description?: string;
  lottieUrl: string;
  jsonUrl?: string;
  animation?: object; // The actual Lottie JSON
  bgColor?: string;
  speed?: number;
  author?: {
    id: string;
    name: string;
  };
}

export interface SearchOptions {
  query: string;
  page?: number;
  limit?: number;
}

export interface PopularOptions {
  page?: number;
  limit?: number;
}

export interface SearchResponse {
  results: LottieSearchResult[];
  currentPage: number;
  totalPages: number;
  totalResults: number;
}

export class LottieLibrary {
  private baseUrl: string;

  constructor(baseUrl = 'https://lottiefiles.com/api') {
    this.baseUrl = baseUrl;
  }

  // --------------------------------------------------------------------------
  // Search Animations
  // --------------------------------------------------------------------------

  async search(options: SearchOptions): Promise<SearchResponse> {
    const { query, page = 1, limit = 20 } = options;

    const url = `${this.baseUrl}/search/get-animations?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();

      // Parse the nested response structure
      const results = this.parseSearchResults(data);

      return {
        results,
        currentPage: page,
        totalPages: data.data?.totalPages || Math.ceil((data.data?.total || 0) / limit),
        totalResults: data.data?.total || results.length,
      };
    } catch (error) {
      throw new Error(`Failed to search animations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // --------------------------------------------------------------------------
  // Get Animation by ID
  // --------------------------------------------------------------------------

  async getAnimation(fileId: string): Promise<LottieAnimationData> {
    const url = `${this.baseUrl}/animations/get-animation-data?fileId=${encodeURIComponent(fileId)}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Get animation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseAnimationData(data);
    } catch (error) {
      throw new Error(`Failed to get animation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // --------------------------------------------------------------------------
  // Get Popular Animations
  // --------------------------------------------------------------------------

  async getPopular(options: PopularOptions = {}): Promise<SearchResponse> {
    const { page = 1, limit = 20 } = options;

    const url = `${this.baseUrl}/iconscout/popular-animations-weekly?api=%26sort%3Dpopular&page=${page}&limit=${limit}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Get popular failed: ${response.statusText}`);
      }

      const data = await response.json();
      const results = this.parseSearchResults(data);

      return {
        results,
        currentPage: page,
        totalPages: data.data?.totalPages || 1,
        totalResults: data.data?.total || results.length,
      };
    } catch (error) {
      throw new Error(`Failed to get popular animations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // --------------------------------------------------------------------------
  // Download Animation JSON
  // --------------------------------------------------------------------------

  async downloadAnimation(lottieUrl: string): Promise<object> {
    try {
      const response = await fetch(lottieUrl);
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to download animation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // --------------------------------------------------------------------------
  // Search and Download (convenience method)
  // --------------------------------------------------------------------------

  async searchAndDownload(query: string, index = 0): Promise<object | null> {
    const searchResult = await this.search({ query, limit: index + 1 });

    if (searchResult.results.length <= index) {
      return null;
    }

    const animation = searchResult.results[index];
    return this.downloadAnimation(animation.lottieUrl);
  }

  // --------------------------------------------------------------------------
  // Featured Categories
  // --------------------------------------------------------------------------

  async getFeatured(): Promise<SearchResponse> {
    return this.search({ query: 'featured', limit: 50 });
  }

  async getByCategory(category: string, options: PopularOptions = {}): Promise<SearchResponse> {
    return this.search({ query: category, ...options });
  }

  // Common categories
  static readonly CATEGORIES = {
    LOADING: 'loading',
    SUCCESS: 'success',
    ERROR: 'error',
    EMPTY: 'empty state',
    ARROWS: 'arrow',
    ICONS: 'icon',
    CHARACTERS: 'character',
    SOCIAL: 'social media',
    WEATHER: 'weather',
    TECHNOLOGY: 'technology',
    BUSINESS: 'business',
    EDUCATION: 'education',
    HEALTH: 'health',
    FOOD: 'food',
    ANIMALS: 'animal',
    NATURE: 'nature',
    SPORTS: 'sports',
    MUSIC: 'music',
    CELEBRATION: 'celebration',
    LOVE: 'love heart',
  };

  // --------------------------------------------------------------------------
  // Private: Parse Response Data
  // --------------------------------------------------------------------------

  private parseSearchResults(data: any): LottieSearchResult[] {
    // Handle different response structures
    const items = data.data?.data || data.data?.results || data.results || data.data || [];

    if (!Array.isArray(items)) {
      return [];
    }

    return items.map((item: any) => this.parseSearchItem(item));
  }

  private parseSearchItem(item: any): LottieSearchResult {
    return {
      id: item.id || item.fileId || item.slug || '',
      name: item.name || item.title || 'Untitled',
      description: item.description || item.desc || undefined,
      createdAt: item.createdAt || item.created_at || '',
      lottieUrl: item.lottieUrl || item.jsonUrl || item.lottie_url || item.url || '',
      gifUrl: item.gifUrl || item.gif_url || item.preview?.gif || undefined,
      imageUrl: item.imageUrl || item.image_url || item.preview?.image || item.thumbnail || undefined,
      bgColor: item.bgColor || item.bg_color || item.backgroundColor || undefined,
      author: item.user || item.author ? {
        id: item.user?.id || item.author?.id || '',
        name: item.user?.name || item.author?.name || item.user?.username || 'Unknown',
        avatarUrl: item.user?.avatarUrl || item.author?.avatar || undefined,
      } : undefined,
      tags: item.tags || item.keywords || [],
    };
  }

  private parseAnimationData(data: any): LottieAnimationData {
    const item = data.data || data;

    return {
      id: item.id || item.fileId || '',
      name: item.name || item.title || 'Untitled',
      description: item.description || undefined,
      lottieUrl: item.lottieUrl || item.jsonUrl || item.url || '',
      jsonUrl: item.jsonUrl || item.lottieUrl || undefined,
      animation: item.animation || item.lottie || undefined,
      bgColor: item.bgColor || item.backgroundColor || undefined,
      speed: item.speed || 1,
      author: item.user || item.author ? {
        id: item.user?.id || item.author?.id || '',
        name: item.user?.name || item.author?.name || 'Unknown',
      } : undefined,
    };
  }
}

// --------------------------------------------------------------------------
// Factory Function
// --------------------------------------------------------------------------

export function createLibrary(): LottieLibrary {
  return new LottieLibrary();
}
