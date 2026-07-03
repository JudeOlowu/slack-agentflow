# AgentFlow — MCP-Powered Research Agent for Slack

> 🏆 Built for the [Slack Agent Builder Challenge](https://slackhack.devpost.com) | $42,000 in prizes

## What is AgentFlow?

AgentFlow is an AI research agent that lives inside Slack, powered by **Model Context Protocol (MCP)** tool orchestration. It transforms Slack from a messaging platform into an intelligent research command center.

Instead of switching between browser tabs, search engines, and AI chatbots, teams can run complex research and decision analysis workflows directly in their Slack channels.

## 🔧 Core Tools (MCP Servers)

| Tool | Description | MCP Pattern |
|------|-------------|-------------|
| 🔍 **Research** | Live web search with source extraction | `search → extract → synthesize` |
| 🏛️ **Council** | Multi-perspective analysis (5 AI advisors + peer review + chairman synthesis) | `spawn → deliberate → synthesize` |
| 🧠 **Memory** | Persistent context across conversations | `store → retrieve → search` |
| 📝 **Summarize** | Channel/thread summarization into structured notes | `fetch → analyze → structure` |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Slack Platform                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ /research │  │ /council │  │ Agent Assistant   │  │
│  │ command   │  │ command  │  │ (DM / @mention)  │  │
│  └─────┬─────┘  └─────┬────┘  └────────┬─────────┘  │
└────────┼──────────────┼───────────────┼─────────────┘
         │              │               │
         ▼              ▼               ▼
┌─────────────────────────────────────────────────────┐
│              AgentFlow Core (Bolt SDK)               │
│  ┌──────────────────────────────────────────────┐   │
│  │           Tool Planner (MCP Client)           │   │
│  │   Analyzes intent → selects tools → chains    │   │
│  └──────────┬───────────┬──────────┬─────────┘   │
│             │           │          │              │
│  ┌──────────▼┐ ┌────────▼──┐ ┌────▼──────┐     │
│  │ Research  │ │  Council  │ │  Memory   │      │
│  │ MCP Server│ │ MCP Server│ │ MCP Server│ ... │
│  └──────────┘ └───────────┘ └───────────┘      │
│             │           │          │              │
│  ┌──────────▼───────────▼──────────▼────────┐   │
│  │          LLM Synthesis Layer              │   │
│  │   Combines tool outputs → Slack mrkdwn    │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
         │                    │
         ▼                    ▼
┌──────────────┐    ┌──────────────────┐
│  Tavily API  │    │  OpenAI / Local  │
│  (Web Search)│    │  LLM Provider    │
└──────────────┘    └──────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A Slack workspace (or [developer sandbox](https://api.slack.com/developer-program/join))
- An LLM API key (OpenAI, OpenRouter, or compatible)

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/slack-agentflow.git
cd slack-agentflow
npm install
```

### 2. Create Slack App
1. Go to [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → **From scratch**
2. Name it `AgentFlow` and select your workspace
3. Enable **Socket Mode** (Settings → Socket Mode → Enable)
4. Generate an **App-Level Token** with `connections:write` scope
5. Under **OAuth & Permissions**, add these Bot Token Scopes:
   - `assistant:write`
   - `chat:write`
   - `channels:history`
   - `channels:read`
   - `commands`
   - `app_mentions:read`
   - `search:read`
6. Enable **Agents & AI Apps** feature
7. Create slash commands: `/research`, `/council`, `/agentflow`
8. Subscribe to events: `app_mention`, `message.channels`, `message.im`, `assistant_thread_started`, `assistant_thread_context_changed`
9. Install to workspace and copy tokens

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your tokens
```

### 4. Run
```bash
npm start
```

## 💡 Usage Examples

### Research
```
/research latest developments in agentic AI commerce 2026
```
Returns structured findings with sources, snippets, and relevance scores.

### Council (Multi-Perspective Analysis)
```
/council Should we adopt MCP as our primary agent integration pattern or build custom APIs?
```
Returns opinions from 5 independent advisors + chairman synthesis with a clear recommendation.

### Conversational (DM or @mention)
```
@AgentFlow What are the top 3 risks of shipping without automated testing?
```

### Memory
```
@AgentFlow Remember that our product launch is scheduled for September 15th
```

## 🏗️ Tech Stack

- **Runtime**: Node.js + [Slack Bolt SDK](https://slack.dev/bolt-js)
- **Protocol**: Model Context Protocol (MCP) — open standard for AI tool orchestration
- **Search**: [Tavily API](https://tavily.com) with DuckDuckGo fallback
- **LLM**: OpenAI GPT-4o-mini (configurable — supports OpenRouter, local models)
- **Persistence**: JSON file storage for memory
- **Transport**: Socket Mode (no public URL needed)

## 📄 License

MIT

## 🏆 Hackathon

Built for the **Slack Agent Builder Challenge** (May 20 – July 13, 2026).

**Track**: New Slack Agent  
**Technologies**: MCP Server Integration, Slack AI Capabilities
