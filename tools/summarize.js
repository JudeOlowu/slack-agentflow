/**
 * Summarize Tool — Channel and thread summarization
 * Uses Slack Web API to fetch messages, then LLM to summarize
 */

const { generateResponse } = require('../llm');

/**
 * Summarize content (messages, threads, or raw text)
 * @param {Object} args - { content: string, channelId?: string, threadTs?: string }
 * @returns {Object} Summary results
 */
async function summarizeTool(args) {
  const { content } = args;

  // For now, summarize the provided content directly
  // When connected to Slack Web API, can fetch channel/thread messages
  try {
    const summary = await generateResponse(
      `Summarize the following into structured notes with:
- Key decisions made
- Action items identified
- Open questions remaining
- Important context/deadlines

Content to summarize:\n${content}`,
      []
    );

    return {
      summary,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      summary: `Unable to summarize: ${error.message}`,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = { summarizeTool };
