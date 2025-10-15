# Monero Node Setup Guide

This guide explains how to set up a Monero wallet RPC server for the marketplace escrow system.

## Prerequisites

- A running Monero daemon (`monerod`)
- Monero wallet RPC (`monero-wallet-rpc`)
- (Optional) Tor for anonymous connections

## Basic Setup (Clearnet)

### 1. Start Monero Daemon

\`\`\`bash
monerod --detach
\`\`\`

### 2. Start Wallet RPC

\`\`\`bash
monero-wallet-rpc \
  --rpc-bind-port 18082 \
  --wallet-file /path/to/your/wallet \
  --password your-wallet-password \
  --rpc-login username:password \
  --disable-rpc-login  # Remove this in production!
\`\`\`

### 3. Configure Environment Variables

Add to your `.env.local`:

\`\`\`env
MONERO_RPC_HOST=localhost
MONERO_RPC_PORT=18082
MONERO_RPC_USERNAME=username
MONERO_RPC_PASSWORD=password
\`\`\`

## Tor Setup (Recommended for Production)

### 1. Install and Configure Tor

\`\`\`bash
sudo apt install tor
\`\`\`

Add to `/etc/tor/torrc`:

\`\`\`
HiddenServiceDir /var/lib/tor/monerod
HiddenServicePort 18089 127.0.0.1:18089
HiddenServicePort 18084 127.0.0.1:18084
\`\`\`

Restart Tor:

\`\`\`bash
sudo systemctl restart tor
\`\`\`

Get your onion address:

\`\`\`bash
cat /var/lib/tor/monerod/hostname
\`\`\`

### 2. Start Monero Daemon with Tor

\`\`\`bash
monerod \
  --anonymous-inbound=yourlongv3onionaddress.onion:18084,127.0.0.1:18084 \
  --tx-proxy=tor,127.0.0.1:9050,disable_noise \
  --detach
\`\`\`

### 3. Start Wallet RPC with Tor

\`\`\`bash
monero-wallet-rpc \
  --rpc-bind-port 18089 \
  --wallet-file /path/to/your/wallet \
  --password your-wallet-password \
  --rpc-login username:password \
  --daemon-address yourlongv3onionaddress.onion:18084 \
  --proxy 127.0.0.1:9050
\`\`\`

### 4. Configure Environment Variables for Tor

\`\`\`env
MONERO_RPC_HOST=yourlongv3onionaddress.onion
MONERO_RPC_PORT=18089
MONERO_RPC_USERNAME=username
MONERO_RPC_PASSWORD=password
MONERO_USE_TOR=true
\`\`\`

## Testing the Connection

Test your RPC connection:

\`\`\`bash
# Clearnet
curl -X POST http://localhost:18082/json_rpc \
  -d '{"jsonrpc":"2.0","id":"0","method":"get_height"}' \
  -H 'Content-Type: application/json'

# Tor
curl -x socks5h://127.0.0.1:9050 \
  http://yourlongv3onionaddress.onion:18089/json_rpc \
  -d '{"jsonrpc":"2.0","id":"0","method":"get_height"}' \
  -H 'Content-Type: application/json'
\`\`\`

## Security Considerations

1. **Never expose RPC without authentication** - Always use `--rpc-login`
2. **Use Tor in production** - Protects both server and client privacy
3. **Backup your wallet** - Store wallet files and seeds securely
4. **Use a dedicated escrow wallet** - Don't mix personal funds with marketplace escrow
5. **Monitor confirmations** - Require at least 10 confirmations before releasing escrow

## Escrow Wallet Management

The marketplace uses a single wallet with multiple subaddresses:
- Each order gets a unique subaddress
- Funds are tracked per subaddress
- Releases are sent from the main wallet to seller addresses

### Creating the Escrow Wallet

\`\`\`bash
monero-wallet-cli --generate-new-wallet /path/to/escrow-wallet
\`\`\`

Save the seed phrase securely!

## Production Checklist

- [ ] Monero daemon synced to current height
- [ ] Wallet RPC running with authentication
- [ ] Tor configured (if using onion services)
- [ ] Environment variables set correctly
- [ ] Wallet backup stored securely
- [ ] RPC connection tested successfully
- [ ] Firewall rules configured (if needed)

## Troubleshooting

### Connection Refused
- Check if wallet RPC is running: `ps aux | grep monero-wallet-rpc`
- Verify port is correct: `netstat -tlnp | grep 18082`

### Authentication Failed
- Verify username/password in environment variables
- Check RPC login settings in wallet RPC startup command

### Tor Connection Issues
- Verify Tor is running: `systemctl status tor`
- Check onion address: `cat /var/lib/tor/monerod/hostname`
- Test with curl using SOCKS5 proxy

## Additional Resources

- [Monero RPC Documentation](https://www.getmonero.org/resources/developer-guides/wallet-rpc.html)
- [Monero Tor Guide](https://www.getmonero.org/resources/user-guides/tor_wallet.html)
- [Monero Best Practices](https://www.getmonero.org/get-started/faq/)
