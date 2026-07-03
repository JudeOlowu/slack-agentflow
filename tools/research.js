/**
 * Research Tool — Web search + content extraction
 * Acts as an MCP server providing search capabilities to the agent
 */

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

/**
 * Execute web research
 * @param {Object} args - { query: string, depth: 'quick' | 'comprehensive' }
 * @returns {Object} Structured research results
 */
async function researchTool(args) {
  const { query, depth = 'comprehensive' } = args;
  const maxResults = depth === 'quick' ? 5 : 10;

  // Use Tavily Search API for high-quality search
  if (TAVILY_API_KEY) {
    return await tavilySearch(query, maxResults, depth);
  }

  // Fallback: use a basic fetch-based search
  return await fallbackSearch(query);
}

async function tavilySearch(query, maxResults, depth) {
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        search_depth: depth === 'comprehensive' ? 'advanced' : 'basic',
        max_results: maxResults,
        include_raw_content: false,
        include_answer: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      summary: data.answer || 'No direct answer available.',
      sources: (data.results || []).map((r) => ({
        title: r.title,
        url: r.url,
        snippet: r.content?.substring(0, 300),
        score: r.score,
      })),
      query,
      timestamp: new Date().toISOString(),
      sourceCount: data.results?.length || 0,
    };
  } catch (error) {
    console.error('Tavily search error:', error.message);
    return await fallbackSearch(query);
  }
}

async function fallbackSearch(query) {
  // Simple DuckDuckGo instant answer API fallback
  try {
    const encoded = encodeURIComponent(query);
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1`
    );
    const data = await response.json();

    const results = [];
    if (data.Abstract) {
      results.push({
        title: data.Heading || query,
        url: data.AbstractURL,
        snippet: data.Abstract,
        score: 1.0,
      });
    }

    for (const topic of (data.RelatedTopics || []).slice(0, 5)) {
      if (topic.Text) {
        results.push({
          title: topic.Text.substring(0, 80),
          url: topic.FirstURL,
          snippet: topic.Text,
          score: 0.7,
        });
      }
    }

    return {
      summary: data.Abstract || `Search results for: ${query}`,
      sources: results,
      query,
      timestamp: new Date().toISOString(),
      sourceCount: results.length,
    };
  } catch (error) {
    return {
      summary: `Unable to search for: ${query}. Error: ${error.message}`,
      sources: [],
      query,
      timestamp: new Date().toISOString(),
      sourceCount: 0,
    };
  }
}

module.exports = { researchTool };
