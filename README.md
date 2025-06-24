# Fireplexity

A blazing-fast AI search engine powered by Firecrawl's web scraping API. Get intelligent answers with real-time citations and live data.

## Demo

## Features

- **Real-time Web Search** - Powered by Firecrawl's search API
- **AI Responses** - Streaming answers with GPT-4o
- **Source Citations** - Every claim backed by references
- **Live Stock Data** - Automatic TradingView charts
- **Smart Follow-ups** - AI-generated questions

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
OPENAI_API_KEY=sk-your-api-key
```

### Run
```bash
npm run dev
```

Visit http://localhost:3000

## Tech Stack

- **Firecrawl** - Web scraping API
- **Next.js 15** - React framework
- **OpenAI** - GPT-4
- **Vercel AI SDK** - Streaming
- **TradingView** - Stock charts

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
