/**
 * Queue store — in-memory singleton for local dev.
 * In production with Vercel KV configured, reads/writes go through KV.
 * The module-level Map is the fallback; it persists across requests
 * within the same serverless function instance.
 */

// Module-level in-memory store (works locally and within a single Vercel instance)
const store = new Map()

async function kvGet(key) {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const { kv } = await import('@vercel/kv')
      return await kv.get(key)
    } catch {
      // KV unavailable — fall through to in-memory
    }
  }
  return store.get(key) ?? null
}

async function kvSet(key, value) {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const { kv } = await import('@vercel/kv')
      // TTL: 24 hours
      await kv.set(key, value, { ex: 86400 })
      return
    } catch {
      // Fall through
    }
  }
  store.set(key, value)
}

// ── Public API ──────────────────────────────────────────────────────────────

export async function createBatch(batchId, { jobs, config }) {
  const record = {
    status:    'processing',
    processed: 0,
    total:     jobs.length,
    results:   [],
    errors:    [],
    config,
    jobs,
    createdAt: Date.now(),
  }
  await kvSet(batchId, record)
  return record
}

export async function getBatch(batchId) {
  return kvGet(batchId)
}

export async function updateBatch(batchId, updates) {
  const current = await kvGet(batchId)
  if (!current) return null
  const next = { ...current, ...updates }
  await kvSet(batchId, next)
  return next
}
