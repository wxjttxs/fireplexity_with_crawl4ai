export function isValidImageUrl(url: string | undefined): boolean {
  if (!url) return false;
  
  // Filter out known problematic URLs
  const problematicPatterns = [
    'lookaside.instagram.com',
    'google_widget/crawler',
    '/seo/',
  ];
  
  if (problematicPatterns.some(pattern => url.includes(pattern))) {
    return false;
  }
  
  // For Firecrawl image search results, trust the imageUrl they provide
  // These are already validated image URLs from their search
  try {
    const urlObj = new URL(url);
    // Basic validation - must be http/https
    if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
      return true;
    }
  } catch {
    return false;
  }
  
  return false;
}

export function getFallbackIcon(): string {
  // Return a data URL for a simple globe icon as fallback
  return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Ccircle cx="12" cy="12" r="10"%3E%3C/circle%3E%3Cline x1="2" y1="12" x2="22" y2="12"%3E%3C/line%3E%3Cpath d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"%3E%3C/path%3E%3C/svg%3E';
}