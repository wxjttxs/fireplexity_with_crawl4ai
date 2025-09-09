# Fireplexity v2 with Crawl4ai

AI search engine with web crawling powered by local Crawl4ai service.

<img src="https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExNjBxbWFxamZycWRkMmVhMGFiZnNuZjMxc3lpNHpuamR4OWlwa3F4NSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/QbfaTCB1OmkRmIQwzJ/giphy.gif" width="100%" alt="Fireplexity Demo" />

## Setup

```bash
git clone https://github.com/mendableai/fireplexity.git
cd fireplexity
npm install
```

## Configure

```bash
cp .env.example .env.local
```

Add your keys to `.env.local`:
```
OPENAI_API_KEY=your-openai-api-key
OPENAI_BASE_URL=https://api.openai.com/v1
```

## Start Crawl4ai Service

Make sure you have Crawl4ai running locally on port 11234:

```bash
# Install and run Crawl4ai
pip install crawl4ai
crawl4ai --host 0.0.0.0 --port 11234
```

## Run

```bash
npm run dev
```

Open http://localhost:3000

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/mendableai/fireplexity)

## Get API Keys

- [Crawl4ai](https://github.com/unclecode/crawl4ai) - Local service, no API key needed
- [OpenAI](https://openai.com) or any OpenAI-compatible API provider

MIT License