# Tor Configuration for Monero Marketplace

This guide explains how to set up Tor for anonymous Monero RPC connections.

## Overview

Using Tor with your Monero node provides:
- **Privacy**: Hide your IP address from the network
- **Anonymity**: Prevent transaction correlation
- **Security**: Encrypted connections through Tor network
- **Censorship Resistance**: Access blocked networks

## Prerequisites

- Tor installed and running
- Monero wallet daemon (monero-wallet-rpc)
- Python 3.8+ (for onion address generation)
- **Optional**: Python `cryptography` library for advanced key generation

## Quick Start

### 1. Generate Onion Address

You have two options for generating your Tor v3 onion address:

#### Option A: Using Python Script (Recommended)

**Method 1: With cryptography library (faster)**

\`\`\`bash
# Install dependencies
pip install -r scripts/requirements.txt

# Generate onion address
cd scripts
python3 generate_onion_address.py
\`\`\`

**Method 2: Using Tor's built-in generation (no dependencies)**

\`\`\`bash
cd scripts
python3 generate_onion_address.py --use-tor
\`\`\`

This will create:
- `tor_hidden_service/` - Directory with Tor keys
- `torrc.conf` - Tor configuration
- `monerod.conf` - Monero daemon configuration with the exact flags you need
- Your unique `.onion` address

#### Option B: Manual Generation with Tor

If you prefer to generate keys manually:

\`\`\`bash
# Create temporary torrc
echo 'HiddenServiceDir /tmp/monero_hs' > /tmp/temp_torrc
echo 'HiddenServicePort 18084 127.0.0.1:18084' >> /tmp/temp_torrc

# Start Tor to generate keys
tor -f /tmp/temp_torrc

# Wait a few seconds, then check the address
cat /tmp/monero_hs/hostname

# Copy to proper location
sudo cp -r /tmp/monero_hs /var/lib/tor/monero_rpc
sudo chown -R debian-tor:debian-tor /var/lib/tor/monero_rpc
\`\`\`

### 2. Configure Tor

Copy the generated configuration to Tor:

\`\`\`bash
# Copy hidden service directory
sudo cp -r tor_hidden_service /var/lib/tor/monero_rpc
sudo chown -R debian-tor:debian-tor /var/lib/tor/monero_rpc
sudo chmod 700 /var/lib/tor/monero_rpc

# Add configuration to torrc
sudo cat torrc.conf >> /etc/tor/torrc

# Restart Tor
sudo systemctl restart tor
\`\`\`

### 3. Configure Monero Wallet RPC

Start your Monero wallet with Tor settings using the exact configuration:

\`\`\`bash
monero-wallet-rpc \
  --rpc-bind-ip=127.0.0.1 \
  --rpc-bind-port=18084 \
  --confirm-external-bind \
  --wallet-file /path/to/your/wallet \
  --password your-wallet-password \
  --rpc-login username:password \
  --tx-proxy=tor,127.0.0.1:9050,disable_noise \
  --anonymous-inbound=yourlongv3onionaddress.onion:18084,127.0.0.1:18084
\`\`\`

**Important flags explained:**
- `tx-proxy=tor,127.0.0.1:9050,disable_noise` - Routes transactions through Tor SOCKS5 proxy
- `anonymous-inbound=youronion.onion:18084,127.0.0.1:18084` - Accepts anonymous inbound connections

Or use the generated `monerod.conf` file:

\`\`\`bash
monero-wallet-rpc --config-file monerod.conf
\`\`\`

### 4. Configure Environment Variables

Update your `.env` file:

\`\`\`bash
# Enable Tor
MONERO_USE_TOR=true

# Tor proxy settings
TOR_PROXY_HOST=127.0.0.1
TOR_PROXY_PORT=9050

# Your onion address (from generate_onion_address.py output)
MONERO_ONION_ADDRESS=yourlongv3onionaddress.onion

# Monero RPC settings
MONERO_RPC_HOST=localhost
MONERO_RPC_PORT=18084
MONERO_RPC_USERNAME=username
MONERO_RPC_PASSWORD=password
\`\`\`

### 5. Test Connection

Visit the health check endpoint:

\`\`\`bash
curl http://localhost:3000/api/health/monero
\`\`\`

Expected response:
\`\`\`json
{
  "status": "connected",
  "height": 3045678,
  "useTor": true,
  "torConnected": true
}
\`\`\`

## Manual Configuration

### Tor Configuration (`/etc/tor/torrc`)

\`\`\`
# SOCKS proxy for outgoing connections
SOCKSPort 9050

# Hidden service for Monero RPC
HiddenServiceDir /var/lib/tor/monero_rpc/
HiddenServicePort 18084 127.0.0.1:18084

# Security settings
CookieAuthentication 1
ControlPort 9051
\`\`\`

### Monero Configuration

Add these flags to your `monero-wallet-rpc` command:

\`\`\`bash
# Bind to localhost only
--rpc-bind-ip=127.0.0.1
--rpc-bind-port=18084
--confirm-external-bind

# Tor proxy for transactions
--tx-proxy=tor,127.0.0.1:9050,disable_noise

# Anonymous inbound (optional, for receiving connections)
--anonymous-inbound=youronion.onion:18084,127.0.0.1:18084
\`\`\`

## Verification

### Check Tor Service

\`\`\`bash
# Check if Tor is running
sudo systemctl status tor

# View your onion address
sudo cat /var/lib/tor/monero_rpc/hostname
\`\`\`

### Check Monero Connection

\`\`\`bash
# Test RPC connection
curl -X POST http://127.0.0.1:18084/json_rpc \
  -d '{"jsonrpc":"2.0","id":"0","method":"get_height"}' \
  -H 'Content-Type: application/json' \
  --user username:password
\`\`\`

### Check Tor Proxy

\`\`\`bash
# Test Tor connection
curl --socks5 127.0.0.1:9050 https://check.torproject.org/api/ip
\`\`\`

Expected response: `{"IsTor":true}`

## Security Best Practices

1. **Firewall Rules**: Block direct connections to Monero RPC port
   \`\`\`bash
   sudo ufw deny 18084
   sudo ufw allow from 127.0.0.1 to any port 18084
   \`\`\`

2. **RPC Authentication**: Always use username/password for RPC
   \`\`\`bash
   --rpc-login username:strong_password
   \`\`\`

3. **Wallet Encryption**: Use encrypted wallet files
   \`\`\`bash
   --password your-wallet-password
   \`\`\`

4. **Tor Isolation**: Run Tor in isolated environment
   \`\`\`bash
   # Use separate Tor instance for Monero
   tor -f /etc/tor/torrc-monero
   \`\`\`

5. **Regular Updates**: Keep Tor and Monero updated
   \`\`\`bash
   sudo apt update && sudo apt upgrade tor monero
   \`\`\`

## Troubleshooting

### Python Script Issues

**Missing cryptography module:**
\`\`\`bash
# Install the required dependency
pip install cryptography

# Or use the alternative method
python3 generate_onion_address.py --use-tor
\`\`\`

**Tor not found:**
\`\`\`bash
# Install Tor
sudo apt-get install tor

# Verify installation
which tor
\`\`\`

### Tor Not Connecting

\`\`\`bash
# Check Tor logs
sudo journalctl -u tor -f

# Verify Tor is listening
sudo netstat -tlnp | grep 9050
\`\`\`

### Monero RPC Not Responding

\`\`\`bash
# Check if wallet RPC is running
ps aux | grep monero-wallet-rpc

# Check RPC logs
tail -f ~/.bitmonero/monero-wallet-rpc.log
\`\`\`

### Connection Timeout

- Verify Tor proxy is running: `curl --socks5 127.0.0.1:9050 https://check.torproject.org`
- Check firewall rules: `sudo ufw status`
- Verify onion address is correct: `cat /var/lib/tor/monero_rpc/hostname`

### Permission Denied

\`\`\`bash
# Fix Tor directory permissions
sudo chown -R debian-tor:debian-tor /var/lib/tor/monero_rpc
sudo chmod 700 /var/lib/tor/monero_rpc
\`\`\`

## Advanced Configuration

### Multiple Onion Services

Configure separate onion addresses for RPC and P2P:

\`\`\`
# RPC hidden service
HiddenServiceDir /var/lib/tor/monero_rpc/
HiddenServicePort 18084 127.0.0.1:18084

# P2P hidden service
HiddenServiceDir /var/lib/tor/monero_p2p/
HiddenServicePort 18080 127.0.0.1:18080
\`\`\`

### Tor Bridge Configuration

For censored networks, use Tor bridges:

\`\`\`
UseBridges 1
Bridge obfs4 [bridge address]
ClientTransportPlugin obfs4 exec /usr/bin/obfs4proxy
\`\`\`

### Custom Tor Circuit

Control circuit creation for better anonymity:

\`\`\`
# Enforce new circuit every 10 minutes
MaxCircuitDirtiness 600

# Use specific exit nodes (optional)
ExitNodes {us},{ca},{gb}
\`\`\`

## Production Deployment

### Systemd Service

Create `/etc/systemd/system/monero-wallet-tor.service`:

\`\`\`ini
[Unit]
Description=Monero Wallet RPC with Tor
After=network.target tor.service
Requires=tor.service

[Service]
Type=simple
User=monero
ExecStart=/usr/bin/monero-wallet-rpc \
  --rpc-bind-ip=127.0.0.1 \
  --rpc-bind-port=18084 \
  --confirm-external-bind \
  --wallet-file /var/lib/monero/wallet \
  --password-file /var/lib/monero/.wallet-password \
  --rpc-login username:password \
  --tx-proxy tor,127.0.0.1:9050,disable_noise \
  --anonymous-inbound=yourlongv3onionaddress.onion:18084,127.0.0.1:18084 \
  --log-file /var/log/monero/wallet-rpc.log
Restart=always
RestartSec=30

[Install]
WantedBy=multi-user.target
\`\`\`

Enable and start:

\`\`\`bash
sudo systemctl enable monero-wallet-tor
sudo systemctl start monero-wallet-tor
\`\`\`

## Resources

- [Tor Project Documentation](https://www.torproject.org/docs/)
- [Monero Documentation](https://www.getmonero.org/resources/developer-guides/)
- [Monero RPC Documentation](https://www.getmonero.org/resources/developer-guides/wallet-rpc.html)
- [Tor Hidden Services](https://community.torproject.org/onion-services/)

## Support

For issues or questions:
1. Check logs: `sudo journalctl -u tor -f` and `tail -f ~/.bitmonero/monero-wallet-rpc.log`
2. Test connection: Visit `/api/health/monero` endpoint
3. Verify configuration: Review environment variables and Tor settings
