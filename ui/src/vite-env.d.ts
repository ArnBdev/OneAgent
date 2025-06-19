/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ONEAGENT_MCP_URL: string
  readonly VITE_ONEAGENT_MEMORY_URL: string
  readonly VITE_ONEAGENT_API_BASE: string
  readonly VITE_ONEAGENT_WS_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
