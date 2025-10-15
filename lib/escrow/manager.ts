/**
 * Escrow Manager for handling XMR payments and releases
 * This manages the flow of funds from buyer to seller through escrow
 */

import { moneroRPC } from "@/lib/monero/rpc"

export class EscrowManager {
  /**
   * Create an escrow payment address for an order
   */
  async createEscrowAddress(orderId: string): Promise<{ address: string; addressIndex: number }> {
    // Generate a unique subaddress for this order
    const { address, addressIndex } = await moneroRPC.createAddress(0)

    console.log("[v0] Created escrow address for order:", orderId, "address:", address)

    return { address, addressIndex }
  }

  /**
   * Check if payment has been received for an order
   */
  async checkPayment(addressIndex: number, expectedAmount: number): Promise<boolean> {
    const transfers = await moneroRPC.getTransfers(addressIndex)

    // Check if any incoming transfer matches the expected amount
    const paymentReceived = transfers.some((transfer: any) => {
      return transfer.amount >= expectedAmount && transfer.confirmations >= 10 // Require 10 confirmations
    })

    return paymentReceived
  }

  /**
   * Release escrowed funds to seller
   */
  async releaseFunds(sellerAddress: string, amount: number, orderId: string): Promise<string> {
    console.log("[v0] Releasing", amount, "XMR to seller for order:", orderId)

    // Transfer funds from escrow wallet to seller's address
    const { txHash } = await moneroRPC.transfer(sellerAddress, amount)

    console.log("[v0] Funds released, tx hash:", txHash)

    return txHash
  }

  /**
   * Get escrow balance for an address
   */
  async getEscrowBalance(addressIndex: number): Promise<number> {
    const { unlockedBalance } = await moneroRPC.getBalance(addressIndex)
    return unlockedBalance
  }

  /**
   * Handle refund to buyer (in case of dispute)
   */
  async refundBuyer(buyerAddress: string, amount: number, orderId: string): Promise<string> {
    console.log("[v0] Refunding", amount, "XMR to buyer for order:", orderId)

    const { txHash } = await moneroRPC.transfer(buyerAddress, amount)

    console.log("[v0] Refund processed, tx hash:", txHash)

    return txHash
  }
}

// Export singleton instance
export const escrowManager = new EscrowManager()
