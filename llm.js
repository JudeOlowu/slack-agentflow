/**
 * LLM Integration — Uses OpenAI-compatible API (works with OpenAI, OpenRouter, local models)
 * Generates synthesized responses from tool outputs
 */
const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY,
  baseURL: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
});

const MODEL = process.env.LLM_MODEL || 'gpt-4o-mini';

/**
 * Generate a response using LLM with tool context
 * @param {string} userMessage - The original user query
 * @param {Array} toolResults - Results from MCP tools [{tool, result}]
 * @returns {string} Formatted Slack markdown response
 */
async function generateResponse(userMessage, toolResults = []) {
  const toolContext = toolResults
    .map((tr) => `[Tool: ${tr.tool}]\n${JSON.stringify(tr.result, null, 2)}`)
    .join('\n\n---\n\n');

  const systemPrompt = `You are AgentFlow, an AI research agent embedded in Slack.
Your job is to provide clear, actionable, well-structured responses.

FORMATTING RULES (Slack mrkdwn):
- Use *bold* for emphasis (not **bold**)
- Use _italic_ for subtle notes
- Use \`code\` for technical terms
- Use bullet points (•) for lists
- Use numbered lists (1. 2. 3.) for sequences
- Use > for blockquotes
- Keep responses concise but thorough
- Always cite sources when available
- End with a clear takeaway or next step

PERSONALITY:
- Professional but approachable
- Data-driven, cite specifics
- Proactive — suggest follow-up actions
- Concise — respect people's time`;

  const messages = [
    { role: 'system', content: systemPrompt },
  ];

  if (toolContext) {
    messages.push({
      role: 'system',
      content: `TOOL RESULTS (use these to inform your response):\n\n${toolContext}`,
    });
  }

  messages.push({ role: 'user', content: userMessage });

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages,
      max_tokens: 2000,
      temperature: 0.7,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('LLM Error:', error.message);
    // Fallback: format tool results directly
    if (toolResults.length > 0) {
      return formatToolResultsFallback(userMessage, toolResults);
    }
    throw error;
  }
}

/**
 * Fallback formatter when LLM is unavailable
 */
function formatToolResultsFallback(query, toolResults) {
  let response = `📋 *Results for:* _${query}_\n\n`;

  for (const tr of toolResults) {
    response += `*🔧 ${tr.tool}:*\n`;
    if (typeof tr.result === 'string') {
      response += tr.result + '\n\n';
    } else if (tr.result.summary) {
      response += tr.result.summary + '\n\n';
    } else {
      response += '```' + JSON.stringify(tr.result, null, 2).substring(0, 1500) + '```\n\n';
    }
  }

  return response;
}

module.exports = { generateResponse };
