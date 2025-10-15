import { SocksProxyAgent } from "socks-proxy-agent"

interface TorProxyConfig {
  enabled: boolean
  host: string
  port: number
  onionAddress?: string
}

/**
 * Get Tor proxy configuration from environment variables
 */
export function getTorProxyConfig(): TorProxyConfig {
  const enabled = process.env.MONERO_USE_TOR === "true"
  const host = process.env.TOR_PROXY_HOST || "127.0.0.1"
  const port = Number.parseInt(process.env.TOR_PROXY_PORT || "9050", 10)
  const onionAddress = process.env.MONERO_ONION_ADDRESS

  return {
    enabled,
    host,
    port,
    onionAddress,
  }
}

/**
 * Create a SOCKS5 proxy agent for Tor connections
 */
export function createTorProxyAgent(): any {
  const config = getTorProxyConfig()

  if (!config.enabled) {
    return undefined
  }

  const proxyUrl = `socks5://${config.host}:${config.port}`
  return new SocksProxyAgent(proxyUrl)
}

/**
 * Get the appropriate RPC host based on Tor configuration
 * Returns onion address if Tor is enabled and configured, otherwise returns clearnet host
 */
export function getMoneroRPCHost(): string {
  const config = getTorProxyConfig()

  if (config.enabled && config.onionAddress) {
    return config.onionAddress
  }

  return process.env.MONERO_RPC_HOST || "localhost"
}

/**
 * Check if Tor proxy is accessible
 */
export async function checkTorConnection(): Promise<boolean> {
  const config = getTorProxyConfig()

  if (!config.enabled) {
    return false
  }

  try {
    const agent = createTorProxyAgent()

    // Try to connect to Tor check service
    const response = await fetch("https://check.torproject.org/api/ip", {
      // @ts-ignore - agent type compatibility
      agent,
      signal: AbortSignal.timeout(10000),
    })

    const data = await response.json()
    return data.IsTor === true
  } catch (error) {
    console.error("[Tor] Connection check failed:", error)
    return false
  }
}
