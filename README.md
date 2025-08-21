<div align="center">

# Fireplexity v2

A blazing-fast AI search engine powered by Firecrawl v2's unified search API and Groq's Kimi K2 Instruct model. Get intelligent answers with real-time web results, news, images, and citations—all in a single API request.

<img src="https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExNjBxbWFxamZycWRkMmVhMGFiZnNuZjMxc3lpNHpuamR4OWlwa3F4NSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/QbfaTCB1OmkRmIQwzJ/giphy.gif" width="100%" alt="Fireplexity Demo" />

</div>

## Features

- **[Firecrawl v2 Search API](https://docs.firecrawl.dev/api-reference/v2-endpoint/search)** - Single endpoint returns web results, news, and images simultaneously
- **Multi-Source Search** - Web pages, news articles, and images unified in one powerful search
- **Groq LLM Integration** - Powered by the Kimi K2 Instruct model for superior performance
- **[Streamdown](https://github.com/vercel/streamdown)** - Advanced markdown streaming with real-time rendering
- **Real-time Web Search** - Instant results with Firecrawl's v2 search API
- **News Integration** - Latest news articles with thumbnails and dates
- **Image Gallery** - Visual search results with modal viewer and source links
- **AI Responses** - Streaming answers with intelligent context understanding
- **Source Citations** - Every claim backed by references with favicons
- **Live Stock Data** - Automatic TradingView charts for company mentions
- **Smart Follow-ups** - AI-generated related questions
- **Mobile Optimized** - Horizontal scrolling galleries and responsive design

## Quick Start

### Clone & Install
```bash
git clone https://github.com/mendableai/fireplexity.git
cd fireplexity
npm install
```

### Set API Keys
```bash
cp .env.example .env.local
```

Add to `.env.local`:
```
FIRECRAWL_API_KEY=fc-your-api-key
GROQ_API_KEY=gsk_your-groq-api-key
```

### Run
```bash
npm run dev
```

Visit http://localhost:3000

## API Implementation

This project uses direct API calls to Firecrawl v2's search endpoint instead of the SDK to ensure all response fields are preserved:

```javascript
// Direct API call to get full response including imageUrl, dates, etc.
const response = await fetch('https://api.firecrawl.dev/v2/search', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: searchQuery,
    sources: ['web', 'news', 'images'],
    limit: 6
  })
})
```

The v2 search endpoint returns:
- **Web results** - URLs, titles, descriptions, content
- **News results** - Articles with dates, thumbnails, sources
- **Images** - URLs with dimensions, titles, source pages

## Tech Stack

- **[Firecrawl v2 Search](https://docs.firecrawl.dev/api-reference/v2-endpoint/search)** - Unified search API returning web, news, and images in a single request
- **Next.js 15** - React framework with App Router
- **Groq** - Kimi K2 Instruct model for AI responses
- **[Streamdown](https://github.com/vercel/streamdown)** - Vercel's markdown streaming library for real-time rendering
- **Vercel AI SDK** - Streaming AI responses
- **TradingView** - Live stock charts
- **Tailwind CSS** - Responsive styling
- **Lucide Icons** - Beautiful icons

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmendableai%2Ffireplexity)

## Resources

- [Firecrawl Docs](https://docs.firecrawl.dev)
- [Get API Key](https://firecrawl.dev)
- [Discord Community](https://discord.gg/firecrawl)

## License

MIT License

---

Powered by [Firecrawl](https://firecrawl.dev)
