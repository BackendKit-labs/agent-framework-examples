#!/usr/bin/env node

/**
 * News Research MCP Server
 *
 * Servidor MCP externo que obtiene noticias financieras y analiza sentimiento.
 * Se comunica con el backend via stdio transport.
 *
 * Uso: node dist/index.js
 */

interface NewsArticle {
  title: string;
  description: string;
  sourceName: string;
  sourceType: 'traditional' | 'social' | 'blog' | 'official';
  url: string;
  publishedAt: string;
}

interface SentimentResult {
  ticker: string;
  overallScore: number;
  confidence: number;
  sources: Array<{
    title: string;
    sourceName: string;
    sourceType: string;
    url: string;
    publishedAt: string;
    sentimentScore: number;
    reliabilityScore: number;
  }>;
  summary: string;
  timestamp: string;
}

// Simulated news database for development
const MOCK_NEWS: Record<string, NewsArticle[]> = {
  AAPL: [
    { title: 'Apple Reports Record Quarterly Revenue', description: 'Apple Inc. announced record quarterly revenue of $124.3B, exceeding analyst expectations.', sourceName: 'Reuters', sourceType: 'traditional', url: 'https://reuters.com/apple-q1', publishedAt: new Date(Date.now() - 3600000).toISOString() },
    { title: 'Apple Vision Pro Sales Surpass 1M Units', description: 'Apple\'s mixed reality headset reaches milestone faster than expected.', sourceName: 'Bloomberg', sourceType: 'traditional', url: 'https://bloomberg.com/apple-vp', publishedAt: new Date(Date.now() - 7200000).toISOString() },
    { title: 'Analysts Raise Apple Price Target', description: 'Multiple analysts raise price target citing strong services growth.', sourceName: 'Seeking Alpha', sourceType: 'blog', url: 'https://seekingalpha.com/apple', publishedAt: new Date(Date.now() - 14400000).toISOString() },
  ],
  MSFT: [
    { title: 'Microsoft Azure Growth Accelerates', description: 'Azure cloud revenue grows 30% year-over-year, beating estimates.', sourceName: 'Reuters', sourceType: 'traditional', url: 'https://reuters.com/msft-azure', publishedAt: new Date(Date.now() - 1800000).toISOString() },
    { title: 'Microsoft AI Copilot Adoption Rising', description: 'Enterprise adoption of Microsoft 365 Copilot doubles in Q2.', sourceName: 'Financial Times', sourceType: 'traditional', url: 'https://ft.com/msft-ai', publishedAt: new Date(Date.now() - 3600000).toISOString() },
  ],
  TSLA: [
    { title: 'Tesla Delivery Numbers Miss Estimates', description: 'Tesla Q1 deliveries fall short of analyst expectations by 8%.', sourceName: 'Reuters', sourceType: 'traditional', url: 'https://reuters.com/tsla-deliveries', publishedAt: new Date(Date.now() - 5400000).toISOString() },
    { title: 'Tesla Cybertruck Production Ramps Up', description: 'Tesla reaches 1,000 Cybertrucks per week production milestone.', sourceName: 'Bloomberg', sourceType: 'traditional', url: 'https://bloomberg.com/tsla-cyber', publishedAt: new Date(Date.now() - 10800000).toISOString() },
    { title: 'Elon Musk Comments on Twitter/X Integration', description: 'Musk hints at deeper integration between Tesla and X platforms.', sourceName: 'Twitter', sourceType: 'social', url: 'https://twitter.com/elonmusk', publishedAt: new Date(Date.now() - 3600000).toISOString() },
  ],
  BTC: [
    { title: 'Bitcoin ETF Inflows Reach New High', description: 'Spot Bitcoin ETFs see record daily inflows of $1.2B.', sourceName: 'CoinDesk', sourceType: 'blog', url: 'https://coindesk.com/btc-etf', publishedAt: new Date(Date.now() - 1200000).toISOString() },
    { title: 'El Salvador Continues Bitcoin Purchases', description: 'El Salvador adds 50 BTC to its strategic reserve.', sourceName: 'Reuters', sourceType: 'traditional', url: 'https://reuters.com/btc-salvador', publishedAt: new Date(Date.now() - 7200000).toISOString() },
  ],
};

// Simple sentiment analysis based on keywords
function analyzeSentiment(articles: NewsArticle[]): { score: number; confidence: number } {
  if (articles.length === 0) return { score: 0, confidence: 0 };

  const positiveWords = ['record', 'surpass', 'growth', 'beat', 'raise', 'adoption', 'milestone', 'inflows', 'high'];
  const negativeWords = ['miss', 'fall', 'short', 'decline', 'drop', 'investigation', 'lawsuit', 'recall'];

  let totalScore = 0;

  for (const article of articles) {
    const text = `${article.title} ${article.description}`.toLowerCase();
    let score = 0;

    for (const word of positiveWords) {
      if (text.includes(word)) score += 0.2;
    }
    for (const word of negativeWords) {
      if (text.includes(word)) score -= 0.25;
    }

    // Source type weighting
    if (article.sourceType === 'traditional') score *= 1.0;
    else if (article.sourceType === 'official') score *= 0.9;
    else if (article.sourceType === 'blog') score *= 0.6;
    else if (article.sourceType === 'social') score *= 0.3;

    totalScore += score;
  }

  const avgScore = Math.max(-1, Math.min(1, totalScore / articles.length));
  const confidence = Math.min(1, articles.length / 5) * (0.5 + Math.abs(avgScore) * 0.5);

  return { score: Math.round(avgScore * 1000) / 1000, confidence: Math.round(confidence * 1000) / 1000 };
}

function getNewsSentiment(ticker: string): SentimentResult {
  const articles = MOCK_NEWS[ticker.toUpperCase()] || [
    {
      title: `${ticker} Market Update`,
      description: `General market news for ${ticker}`,
      sourceName: 'Financial Times',
      sourceType: 'traditional',
      url: `https://ft.com/${ticker.toLowerCase()}`,
      publishedAt: new Date().toISOString(),
    },
  ];

  const { score, confidence } = analyzeSentiment(articles);

  return {
    ticker: ticker.toUpperCase(),
    overallScore: score,
    confidence,
    sources: articles.map(a => ({
      title: a.title,
      sourceName: a.sourceName,
      sourceType: a.sourceType,
      url: a.url,
      publishedAt: a.publishedAt,
      sentimentScore: score,
      reliabilityScore: a.sourceType === 'traditional' ? 0.9 : a.sourceType === 'official' ? 0.85 : a.sourceType === 'blog' ? 0.5 : 0.3,
    })),
    summary: `${ticker.toUpperCase()}: ${score > 0.3 ? 'Positive' : score < -0.3 ? 'Negative' : 'Neutral'} sentiment based on ${articles.length} sources`,
    timestamp: new Date().toISOString(),
  };
}

// MCP Server via stdio
async function main() {
  const lines: string[] = [];

  process.stdin.on('data', (data: Buffer) => {
    const line = data.toString().trim();
    if (!line) return;

    try {
      const request = JSON.parse(line);

      if (request.method === 'initialize') {
        const response = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {
                get_news_sentiment: {
                  description: 'Analiza sentimiento de noticias para un ticker',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      ticker: { type: 'string', description: 'Stock/crypto ticker symbol' },
                    },
                    required: ['ticker'],
                  },
                },
              },
            },
            serverInfo: { name: 'news-research', version: '1.0.0' },
          },
        };
        process.stdout.write(JSON.stringify(response) + '\n');
      } else if (request.method === 'tools/call' && request.params?.name === 'get_news_sentiment') {
        const ticker = request.params.arguments?.ticker || 'AAPL';
        const result = getNewsSentiment(ticker);
        const response = {
          jsonrpc: '2.0',
          id: request.id,
          result: { content: result },
        };
        process.stdout.write(JSON.stringify(response) + '\n');
      }
    } catch {
      // Ignore parse errors
    }
  });

  // Signal ready
  const ready = { jsonrpc: '2.0', method: 'ready' };
  process.stdout.write(JSON.stringify(ready) + '\n');
}

main().catch(console.error);
