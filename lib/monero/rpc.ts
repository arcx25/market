/**
 * Monero RPC client for payment processing
 * Supports both clearnet and Tor onion service connections
 */

import { createTorProxyAgent, getMoneroRPCHost } from "./tor-proxy"

interface MoneroRPCConfig {
  host: string
  port: number
  username?: string
  password?: string
  useTor?: boolean
  torProxyHost?: string
  torProxyPort?: number
}

interface MoneroRPCResponse<T = any> {
  id: string
  jsonrpc: string
  result?: T
  error?: {
    code: number
    message: string
  }
}

export class MoneroRPC {
  private config: MoneroRPCConfig
  private rpcUrl: string
  private proxyAgent: any

  constructor(config: MoneroRPCConfig) {
    this.config = {
      useTor: false,
      torProxyHost: "127.0.0.1",
      torProxyPort: 9050,
      ...config,
    }

    const host = this.config.useTor ? getMoneroRPCHost() : this.config.host
    const protocol = "http"
    this.rpcUrl = `${protocol}://${host}:${this.config.port}/json_rpc`

    this.proxyAgent = this.config.useTor ? createTorProxyAgent() : undefined
  }

  /**
   * Make a JSON-RPC call to the Monero wallet
   */
  private async call<T = any>(method: string, params: any = {}): Promise<T> {
    const body = {
      jsonrpc: "2.0",
      id: "0",
      method,
      params,
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    // Add basic auth if credentials provided
    if (this.config.username && this.config.password) {
      const auth = Buffer.from(`${this.config.username}:${this.config.password}`).toString("base64")
      headers["Authorization"] = `Basic ${auth}`
    }

    try {
      const fetchOptions: RequestInit = {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      }

      // Add proxy agent for Tor connections
      if (this.proxyAgent) {
        // @ts-ignore - agent type compatibility
        fetchOptions.agent = this.proxyAgent
      }

      const response = await fetch(this.rpcUrl, fetchOptions)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: MoneroRPCResponse<T> = await response.json()

      if (data.error) {
        throw new Error(`Monero RPC error: ${data.error.message} (code: ${data.error.code})`)
      }

      if (!data.result) {
        throw new Error("No result in RPC response")
      }

      return data.result
    } catch (error) {
      console.error("[Monero RPC] Error calling method:", method, error)
      throw error
    }
  }

  /**
   * Generate a new subaddress for receiving payments
   */
  async createAddress(accountIndex = 0, label?: string): Promise<{ address: string; addressIndex: number }> {
    const result = await this.call<{ address: string; address_index: number }>("create_address", {
      account_index: accountIndex,
      label: label || `Order ${Date.now()}`,
    })

    return {
      address: result.address,
      addressIndex: result.address_index,
    }
  }

  /**
   * Check incoming transfers to a specific address
   */
  async getTransfers(
    addressIndex: number,
    accountIndex = 0,
  ): Promise<
    Array<{
      amount: number
      confirmations: number
      txHash: string
      height: number
    }>
  > {
    try {
      const result = await this.call<{ in?: any[] }>("get_transfers", {
        in: true,
        account_index: accountIndex,
        subaddr_indices: [addressIndex],
      })

      if (!result.in || result.in.length === 0) {
        return []
      }

      // Convert from atomic units (piconero) to XMR
      return result.in.map((transfer: any) => ({
        amount: transfer.amount / 1e12, // Convert from piconero to XMR
        confirmations: transfer.confirmations || 0,
        txHash: transfer.txid,
        height: transfer.height,
      }))
    } catch (error) {
      console.error("[Monero RPC] Error getting transfers:", error)
      return []
    }
  }

  /**
   * Get current balance for an address
   */
  async getBalance(addressIndex: number, accountIndex = 0): Promise<{ balance: number; unlockedBalance: number }> {
    const result = await this.call<{
      balance: number
      unlocked_balance: number
      per_subaddress: Array<{
        address_index: number
        balance: number
        unlocked_balance: number
      }>
    }>("get_balance", {
      account_index: accountIndex,
      address_indices: [addressIndex],
    })

    // Find the specific subaddress balance
    const subaddress = result.per_subaddress?.find((sub) => sub.address_index === addressIndex)

    if (subaddress) {
      return {
        balance: subaddress.balance / 1e12, // Convert from piconero to XMR
        unlockedBalance: subaddress.unlocked_balance / 1e12,
      }
    }

    return {
      balance: result.balance / 1e12,
      unlockedBalance: result.unlocked_balance / 1e12,
    }
  }

  /**
   * Send XMR to an address (for escrow release)
   */
  async transfer(address: string, amount: number, accountIndex = 0): Promise<{ txHash: string; fee: number }> {
    // Convert XMR to atomic units (piconero)
    const amountAtomic = Math.floor(amount * 1e12)

    const result = await this.call<{
      tx_hash: string
      fee: number
    }>("transfer", {
      destinations: [
        {
          amount: amountAtomic,
          address,
        },
      ],
      account_index: accountIndex,
      priority: 1, // 0=default, 1=unimportant, 2=normal, 3=elevated, 4=priority
      get_tx_key: true,
    })

    return {
      txHash: result.tx_hash,
      fee: result.fee / 1e12, // Convert fee to XMR
    }
  }

  /**
   * Get wallet height (for sync status)
   */
  async getHeight(): Promise<number> {
    const result = await this.call<{ height: number }>("get_height")
    return result.height
  }

  /**
   * Validate a Monero address
   */
  async validateAddress(address: string): Promise<{ valid: boolean; integrated: boolean; subaddress: boolean }> {
    const result = await this.call<{
      valid: boolean
      integrated: boolean
      subaddress: boolean
    }>("validate_address", {
      address,
    })

    return result
  }
}

// Export singleton instance
// Configuration via environment variables:
// - MONERO_RPC_HOST: Hostname or .onion address (default: localhost)
// - MONERO_RPC_PORT: RPC port (default: 18082 for clearnet, 18084 for Tor)
// - MONERO_RPC_USERNAME: Optional RPC username for authentication
// - MONERO_RPC_PASSWORD: Optional RPC password for authentication
// - MONERO_USE_TOR: Set to 'true' to use Tor onion service (default: false)
// - TOR_PROXY_HOST: Tor SOCKS5 proxy host (default: 127.0.0.1)
// - TOR_PROXY_PORT: Tor SOCKS5 proxy port (default: 9050)
// - MONERO_ONION_ADDRESS: Your Monero node's .onion address (required if MONERO_USE_TOR=true)
//
const rpcHost = process.env.MONERO_RPC_HOST || "localhost"
const rpcPort = Number.parseInt(process.env.MONERO_RPC_PORT || "18082")

if (!rpcHost || isNaN(rpcPort)) {
  console.warn(
    "[Monero RPC] Invalid configuration. Please set MONERO_RPC_HOST and MONERO_RPC_PORT environment variables.",
  )
}

export const moneroRPC = new MoneroRPC({
  host: rpcHost,
  port: rpcPort,
  username: process.env.MONERO_RPC_USERNAME,
  password: process.env.MONERO_RPC_PASSWORD,
  useTor: process.env.MONERO_USE_TOR === "true",
})

export async function checkMoneroRPCConnection(): Promise<{ connected: boolean; height?: number; error?: string }> {
  try {
    const height = await moneroRPC.getHeight()
    return { connected: true, height }
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
