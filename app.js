require('dotenv').config();
const { App, Assistant } = require('@slack/bolt');

const { researchTool } = require('./tools/research');
const { councilTool } = require('./tools/council');
const { memoryTool } = require('./tools/memory');
const { summarizeTool } = require('./tools/summarize');
const { generateResponse } = require('./llm');

// ─── Slack Bolt App (Socket Mode) ───────────────────────────────────────────
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  // Agent capabilities
});

// ─── Tool Registry (MCP-style) ─────────────────────────────────────────────
const TOOLS = {
  research: {
    name: 'research',
    description: 'Search the web for current information on any topic. Returns structured findings with sources.',
    execute: researchTool,
  },
  council: {
    name: 'council',
    description: 'Run a multi-perspective analysis on a question through 5 independent advisors (Contrarian, First Principles, Expansionist, Outsider, Executor), peer review, and chairman synthesis.',
    execute: councilTool,
  },
  memory: {
    name: 'memory',
    description: 'Store and retrieve persistent context across conversations. Remembers project details, decisions, and key facts.',
    execute: memoryTool,
  },
  summarize: {
    name: 'summarize',
    description: 'Summarize a Slack channel or thread conversation into structured notes.',
    execute: summarizeTool,
  },
};

// ─── Assistant (Agent Response Loop) ────────────────────────────────────────
const assistant = new Assistant({
  threadStarted: async ({ event, say, setSuggestedPrompts, saveThreadContext }) => {
    await setSuggestedPrompts({
      title: 'Welcome to AgentFlow 🔬',
      prompts: [
        { title: 'Research a topic', message: 'Research the latest developments in agentic AI commerce' },
        { title: 'Council a decision', message: 'Council this: Should we use MCP or custom API integrations for our new product?' },
        { title: 'Summarize a channel', message: 'Summarize the key decisions from #general this week' },
        { title: 'Remember something', message: 'Remember that our Q3 deadline is September 15th' },
      ],
    });

    await say(
      '👋 I\'m **AgentFlow** — your AI research agent powered by MCP tool orchestration.\n\n' +
      'I can:\n' +
      '• 🔍 **Research** any topic with live web search\n' +
      '• 🏛️ **Council** decisions through 5 independent advisors\n' +
      '• 🧠 **Remember** context across conversations\n' +
      '• 📝 **Summarize** channels and threads\n\n' +
      'Just ask me anything, or try the suggested prompts above!'
    );
  },

  threadContextChanged: async ({ event, saveThreadContext }) => {
    // Persist context when thread changes
    await saveThreadContext();
  },

  userMessage: async ({ event, say, setTitle, setStatus, getThreadContext }) => {
    const userMessage = event.text;

    try {
      // Show thinking status
      await setStatus('Analyzing your request...');

      // Detect which tool(s) to use based on the message
      const toolPlan = await planTools(userMessage);
      
      if (toolPlan.title) {
        await setTitle(toolPlan.title);
      }

      // Execute tool chain
      let toolResults = [];
      for (const step of toolPlan.steps) {
        await setStatus(`🔧 Running: ${step.tool}...`);
        const tool = TOOLS[step.tool];
        if (tool) {
          const result = await tool.execute(step.args);
          toolResults.push({ tool: step.tool, result });
        }
      }

      // Generate final response using LLM + tool results
      await setStatus('Composing response...');
      const response = await generateResponse(userMessage, toolResults);

      await say(response);
    } catch (error) {
      console.error('Agent error:', error);
      await say(`⚠️ Something went wrong: ${error.message}\n\nPlease try rephrasing your request.`);
    }
  },
});

app.assistant(assistant);

// ─── Slash Commands ─────────────────────────────────────────────────────────

// /research [topic] — Quick research from any channel
app.command('/research', async ({ command, ack, respond }) => {
  await ack();
  const topic = command.text;

  if (!topic) {
    await respond('Usage: `/research [topic]`\nExample: `/research latest AI agent frameworks 2026`');
    return;
  }

  await respond({
    response_type: 'in_channel',
    text: `🔍 Researching: *${topic}*\n_Results incoming..._`,
  });

  try {
    const results = await researchTool({ query: topic, depth: 'comprehensive' });
    const response = await generateResponse(
      `Provide a well-structured research briefing on: ${topic}`,
      [{ tool: 'research', result: results }]
    );

    await respond({
      response_type: 'in_channel',
      text: response,
      unfurl_links: false,
    });
  } catch (error) {
    await respond(`⚠️ Research failed: ${error.message}`);
  }
});

// /council [question] — Multi-perspective analysis from any channel
app.command('/council', async ({ command, ack, respond }) => {
  await ack();
  const question = command.text;

  if (!question) {
    await respond('Usage: `/council [question]`\nExample: `/council Should we pivot from B2B to B2C?`');
    return;
  }

  await respond({
    response_type: 'in_channel',
    text: `🏛️ Convening the Council on: *${question}*\n_5 advisors deliberating..._`,
  });

  try {
    const results = await councilTool({ question });
    await respond({
      response_type: 'in_channel',
      text: results.formatted,
      unfurl_links: false,
    });
  } catch (error) {
    await respond(`⚠️ Council failed: ${error.message}`);
  }
});

// /agentflow — Help and status
app.command('/agentflow', async ({ command, ack, respond }) => {
  await ack();
  await respond({
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '🔬 AgentFlow — MCP-Powered Research Agent' },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Available Tools:*\n' +
            Object.values(TOOLS)
              .map((t) => `• \`${t.name}\` — ${t.description}`)
              .join('\n'),
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Slash Commands:*\n' +
            '• `/research [topic]` — Quick web research\n' +
            '• `/council [question]` — Multi-perspective decision analysis\n' +
            '• `/agentflow` — This help menu',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Architecture:*\n' +
            'AgentFlow uses the Model Context Protocol (MCP) pattern to orchestrate multiple specialized tools.\n' +
            'Each tool is a self-contained MCP server that the agent discovers and invokes at runtime.\n\n' +
            '`User → Slack Agent → Tool Planner → MCP Tools → LLM Synthesis → Response`',
        },
      },
      { type: 'divider' },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: '💡 *Tip:* DM me directly or @ mention me in any channel for conversational interaction.',
          },
        ],
      },
    ],
  });
});

// ─── Tool Planner ───────────────────────────────────────────────────────────
async function planTools(message) {
  const lower = message.toLowerCase();
  const plan = { steps: [], title: null };

  // Detect intent from message
  if (lower.includes('council') || lower.includes('debate') || lower.includes('pressure-test') || lower.includes('should we') || lower.includes('pros and cons')) {
    plan.steps.push({ tool: 'council', args: { question: message } });
    plan.title = `Council: ${message.substring(0, 50)}...`;
  } else if (lower.includes('research') || lower.includes('find out') || lower.includes('look up') || lower.includes('what is') || lower.includes('latest') || lower.includes('search')) {
    plan.steps.push({ tool: 'research', args: { query: message, depth: 'comprehensive' } });
    plan.title = `Research: ${message.substring(0, 50)}...`;
  } else if (lower.includes('remember') || lower.includes('store') || lower.includes('save') || lower.includes('recall') || lower.includes('what did')) {
    plan.steps.push({ tool: 'memory', args: { action: lower.includes('recall') || lower.includes('what did') ? 'retrieve' : 'store', content: message } });
    plan.title = `Memory: ${message.substring(0, 50)}...`;
  } else if (lower.includes('summarize') || lower.includes('summary') || lower.includes('recap')) {
    plan.steps.push({ tool: 'summarize', args: { content: message } });
    plan.title = `Summary: ${message.substring(0, 50)}...`;
  } else {
    // Default: research + synthesize
    plan.steps.push({ tool: 'research', args: { query: message, depth: 'quick' } });
    plan.title = message.substring(0, 60);
  }

  return plan;
}

// ─── App Mentions ───────────────────────────────────────────────────────────
app.event('app_mention', async ({ event, client }) => {
  const text = event.text.replace(/<@[A-Z0-9]+>/g, '').trim();

  if (!text) {
    await client.chat.postMessage({
      channel: event.channel,
      thread_ts: event.ts,
      text: '👋 You mentioned me! Ask me anything — I can research topics, council decisions, summarize threads, and more.\n\nTry: `@AgentFlow research the latest MCP server implementations`',
    });
    return;
  }

  try {
    await client.chat.postMessage({
      channel: event.channel,
      thread_ts: event.ts,
      text: `🔄 Processing: _${text.substring(0, 80)}_...`,
    });

    const toolPlan = await planTools(text);
    let toolResults = [];
    for (const step of toolPlan.steps) {
      const tool = TOOLS[step.tool];
      if (tool) {
        const result = await tool.execute(step.args);
        toolResults.push({ tool: step.tool, result });
      }
    }

    const response = await generateResponse(text, toolResults);

    await client.chat.postMessage({
      channel: event.channel,
      thread_ts: event.ts,
      text: response,
    });
  } catch (error) {
    await client.chat.postMessage({
      channel: event.channel,
      thread_ts: event.ts,
      text: `⚠️ Error: ${error.message}`,
    });
  }
});

// ─── Start ──────────────────────────────────────────────────────────────────
(async () => {
  const port = process.env.PORT || 3000;
  await app.start(port);
  console.log(`⚡ AgentFlow is running on port ${port}`);
  console.log('🔧 Registered tools:', Object.keys(TOOLS).join(', '));
})();
