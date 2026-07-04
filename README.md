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

```mermaid
graph TD
    User([User]) -->|DM / @mention / Slash Command| Slack[Slack Platform]
    
    subgraph AgentFlow Server (Node.js/Bolt)
        Slack -->|Events / Command Payload| BoltApp[Bolt SDK App]
        BoltApp -->|User Query| ToolPlanner[Tool Planner]
        
        subgraph MCP Tools
            ToolPlanner -->|Query Context| ResearchTool[Research Tool]
            ToolPlanner -->|Question| CouncilTool[Council Tool]
            ToolPlanner -->|Store / Retrieve| MemoryTool[Memory Tool]
            ToolPlanner -->|Fetch Conversation| SummarizeTool[Summarize Tool]
        end
        
        ResearchTool -->|Web Results| LLMSynthesis[LLM Synthesis Layer]
        CouncilTool -->|Advisor Deliberations| LLMSynthesis
        MemoryTool -->|Context Recall| LLMSynthesis
        SummarizeTool -->|Thread Notes| LLMSynthesis
        
        LLMSynthesis -->|Synthesized mrkdwn| BoltApp
    end
    
    ResearchTool -.->|Search Queries| TavilyAPI[Tavily Search API]
    LLMSynthesis -.->|Completion Request| OpenAIAPI[OpenAI / Compatible LLM]
    BoltApp -->|Socket Mode Connection| Slack
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A Slack workspace (or [developer sandbox](https://api.slack.com/developer-program/join))
- An LLM API key (OpenAI, OpenRouter, or compatible)

### 1. Clone & Install
```bash
git clone https://github.com/JudeOlowu/slack-agentflow.git
cd slack-agentflow
npm install
```

### 2. Create Slack App from Manifest
1. Go to [api.slack.com/apps](https://api.slack.com/apps) → **Create New App**
2. Choose **From an app manifest**
3. Select your workspace (e.g. your Developer Sandbox)
4. Copy the contents of [manifest.json](manifest.json) in this repository and paste it into the JSON input under the **JSON** tab.
5. Click **Next**, review the summary, and click **Create**.
6. Under **Basic Information** > **App Credentials**, copy the **Signing Secret**.
7. Under **Basic Information** > **App-Level Tokens**, click **Generate Token**, name it, select the `connections:write` scope, and generate. Copy the token starting with `xapp-`.
8. Under **OAuth & Permissions**, click **Install to Workspace** and authorize it. Once installed, copy the **Bot User OAuth Token** starting with `xoxb-`.

### 3. Configure Environment
Create a `.env` file in the root directory:
```bash
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
SLACK_APP_TOKEN=xapp-...
OPENAI_API_KEY=sk-...
TAVILY_API_KEY=tvly-...
PORT=3000
```

### 4. Run
```bash
npm run dev
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
