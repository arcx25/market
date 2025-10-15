import { NextResponse } from "next/server"
import { checkMoneroRPCConnection } from "@/lib/monero/rpc"

export async function GET() {
  try {
    const status = await checkMoneroRPCConnection()

    if (!status.connected) {
      return NextResponse.json(
        {
          status: "error",
          message: "Monero RPC connection failed",
          error: status.error,
          config: {
            host: process.env.MONERO_RPC_HOST || "localhost",
            port: process.env.MONERO_RPC_PORT || "18082",
            useTor: process.env.MONERO_USE_TOR === "true",
          },
        },
        { status: 503 },
      )
    }

    return NextResponse.json({
      status: "ok",
      message: "Monero RPC connection successful",
      height: status.height,
      config: {
        host: process.env.MONERO_RPC_HOST || "localhost",
        port: process.env.MONERO_RPC_PORT || "18082",
        useTor: process.env.MONERO_USE_TOR === "true",
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to check Monero RPC connection",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
