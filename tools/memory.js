/**
 * Memory Tool — Persistent context across conversations
 * In-memory store with JSON file persistence
 */

const fs = require('fs');
const path = require('path');

const MEMORY_FILE = path.join(__dirname, '..', 'data', 'memory.json');

// Ensure data directory exists
const dataDir = path.dirname(MEMORY_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Load existing memory
let memoryStore = {};
try {
  if (fs.existsSync(MEMORY_FILE)) {
    memoryStore = JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf8'));
  }
} catch (e) {
  memoryStore = {};
}

function save() {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(memoryStore, null, 2));
}

/**
 * Store or retrieve persistent context
 * @param {Object} args - { action: 'store'|'retrieve'|'list', content: string, key?: string }
 * @returns {Object} Memory result
 */
async function memoryTool(args) {
  const { action, content, key } = args;

  if (action === 'store') {
    const memKey = key || generateKey(content);
    const entry = {
      content,
      timestamp: new Date().toISOString(),
      key: memKey,
    };
    memoryStore[memKey] = entry;
    save();

    return {
      success: true,
      message: `✅ Stored memory: "${memKey}"`,
      key: memKey,
    };
  }

  if (action === 'retrieve') {
    // Search through memories for relevant ones
    const searchTerm = content.toLowerCase();
    const matches = Object.values(memoryStore).filter((m) =>
      m.content.toLowerCase().includes(searchTerm) ||
      m.key.toLowerCase().includes(searchTerm)
    );

    if (matches.length === 0) {
      return {
        success: true,
        message: 'No matching memories found.',
        memories: [],
      };
    }

    return {
      success: true,
      message: `Found ${matches.length} matching memor${matches.length === 1 ? 'y' : 'ies'}.`,
      memories: matches.map((m) => ({
        key: m.key,
        content: m.content,
        timestamp: m.timestamp,
      })),
    };
  }

  if (action === 'list') {
    const entries = Object.values(memoryStore);
    return {
      success: true,
      message: `${entries.length} items in memory.`,
      memories: entries.map((m) => ({
        key: m.key,
        content: m.content.substring(0, 100),
        timestamp: m.timestamp,
      })),
    };
  }

  return { success: false, message: `Unknown action: ${action}` };
}

function generateKey(content) {
  // Extract meaningful key from content
  const words = content
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 4);
  return words.join('-').toLowerCase() || `mem-${Date.now()}`;
}

module.exports = { memoryTool };
