export const ErrorMessages = {
  401: {
    title: "Authentication Required",
    message: "Please check your API key is valid and properly configured.",
    action: "Get your API key",
    actionUrl: "https://github.com/unclecode/crawl4ai"
  },
  402: {
    title: "Credits Exhausted", 
    message: "You've run out of credits for this billing period.",
    action: "Upgrade your plan",
    actionUrl: "https://github.com/unclecode/crawl4ai"
  },
  429: {
    title: "Rate Limit Reached",
    message: "Too many requests. Please wait a moment before trying again.",
    action: "Learn about rate limits",
    actionUrl: "https://github.com/unclecode/crawl4ai"
  },
  500: {
    title: "Something went wrong",
    message: "We encountered an unexpected error. Please try again.",
    action: "Contact support",
    actionUrl: "https://github.com/unclecode/crawl4ai"
  },
  504: {
    title: "Request Timeout",
    message: "This request is taking longer than expected. Try with fewer pages or simpler content.",
    action: "Optimize your request",
    actionUrl: "https://github.com/unclecode/crawl4ai"
  }
} as const

export function getErrorMessage(statusCode: number): typeof ErrorMessages[keyof typeof ErrorMessages] {
  return ErrorMessages[statusCode as keyof typeof ErrorMessages] || ErrorMessages[500]
}