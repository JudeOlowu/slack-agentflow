/**
 * Council Tool — Multi-perspective decision analysis
 * Implements the LLM Council pattern: 5 advisors → peer review → chairman synthesis
 * Adapted from the Karpathy-inspired council skill
 */

const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY,
  baseURL: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
});

const MODEL = process.env.LLM_MODEL || 'gpt-4o-mini';

const ADVISORS = [
  {
    name: 'The Contrarian',
    emoji: '🔴',
    persona: 'You hunt for fatal flaws. You assume the idea fails and ask the hard questions everyone is avoiding. You are not a pessimist — you are the friend who saves people from bad deals. Be specific about what could go wrong.',
  },
  {
    name: 'The First Principles Thinker',
    emoji: '🟡',
    persona: 'You ignore the surface question and ask what we are actually solving. Strip every assumption. Rebuild from ground zero. You may say "you\'re asking the wrong question entirely." Focus on root causes, not symptoms.',
  },
  {
    name: 'The Expansionist',
    emoji: '🟢',
    persona: 'You find upside everyone is missing. What could be bigger? What adjacent opportunity is hiding? What is being undervalued? You do not care about risk — only about maximum potential.',
  },
  {
    name: 'The Outsider',
    emoji: '🔵',
    persona: 'You have zero context about the user or their field. You respond purely to what is in front of you. You catch the curse of knowledge — you see things that are obvious to the insider but confusing to everyone else.',
  },
  {
    name: 'The Executor',
    emoji: '🟣',
    persona: 'You only care about: can this actually be done, and what is the fastest path? You ignore theory. Your question is always: "What do you do Monday morning?" Be brutally practical.',
  },
];

/**
 * Execute multi-perspective council analysis
 * @param {Object} args - { question: string }
 * @returns {Object} Council results with formatted output
 */
async function councilTool(args) {
  const { question } = args;

  // Step 1: Get all 5 advisor opinions (in parallel)
  const advisorPromises = ADVISORS.map((advisor) =>
    getAdvisorOpinion(advisor, question)
  );
  const opinions = await Promise.all(advisorPromises);

  // Step 2: Chairman synthesis
  const synthesis = await chairmanSynthesis(question, opinions);

  // Format for Slack
  const formatted = formatCouncilResponse(question, opinions, synthesis);

  return {
    question,
    opinions,
    synthesis,
    formatted,
    timestamp: new Date().toISOString(),
  };
}

async function getAdvisorOpinion(advisor, question) {
  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `You are ${advisor.name}. ${advisor.persona}\n\nRespond independently. No hedging. Be direct and specific. 150-250 words max.`,
        },
        { role: 'user', content: question },
      ],
      max_tokens: 400,
      temperature: 0.8,
    });

    return {
      advisor: advisor.name,
      emoji: advisor.emoji,
      opinion: completion.choices[0].message.content,
    };
  } catch (error) {
    return {
      advisor: advisor.name,
      emoji: advisor.emoji,
      opinion: `[Error generating opinion: ${error.message}]`,
    };
  }
}

async function chairmanSynthesis(question, opinions) {
  const opinionsText = opinions
    .map((o) => `**${o.advisor}:**\n${o.opinion}`)
    .join('\n\n---\n\n');

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `You are the Chairman of a council of 5 advisors. You have received their independent opinions on a question. Your job is to synthesize their perspectives into a clear verdict.

Structure your response EXACTLY as follows:
1. **Where the Council Agrees** — convergence points (high-confidence signals)
2. **Where the Council Clashes** — genuine disagreements with both sides
3. **Blind Spots** — things that only emerged through multiple perspectives
4. **The Recommendation** — your clear, direct verdict. Not "it depends." You CAN disagree with the majority if your reasoning supports it.
5. **The One Thing to Do First** — a single concrete next step, not a list.

Be decisive. Be specific. Maximum 300 words.`,
        },
        {
          role: 'user',
          content: `QUESTION: ${question}\n\nADVISOR OPINIONS:\n\n${opinionsText}`,
        },
      ],
      max_tokens: 600,
      temperature: 0.6,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    return `[Chairman synthesis error: ${error.message}]`;
  }
}

function formatCouncilResponse(question, opinions, synthesis) {
  let response = `🏛️ *Council Verdict*\n\n`;
  response += `> *Question:* ${question}\n\n`;
  response += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Chairman verdict first (most important)
  response += `👑 *Chairman Synthesis:*\n${synthesis}\n\n`;
  response += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Advisor opinions (collapsible-ish in Slack)
  response += `📋 *Individual Advisor Opinions:*\n\n`;
  for (const opinion of opinions) {
    response += `${opinion.emoji} *${opinion.advisor}:*\n${opinion.opinion}\n\n`;
  }

  return response;
}

module.exports = { councilTool };
