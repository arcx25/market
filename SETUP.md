# PGP Marketplace Setup Guide

## Quick Start

### 1. Database Setup

Run the SQL migration scripts to set up your database schema:

\`\`\`bash
# The scripts will be executed automatically when you run them in v0
# Or manually run them in your Supabase SQL editor
\`\`\`

Scripts to run in order:
1. `scripts/001_extend_schema.sql` - Core schema with PGP auth, categories, escrow
2. `scripts/002_seed_categories.sql` - Sample product categories
3. `scripts/003_upgrade_requests.sql` - Seller upgrade tracking

### 2. Server PGP Key Configuration

You have two options for the server PGP key:

#### Option A: Use Your Own PGP Key (Recommended for Production)

1. Set the environment variables:
   \`\`\`bash
   SERVER_PGP_PRIVATE_KEY="-----BEGIN PGP PRIVATE KEY BLOCK-----
   ... your private key here ...
   -----END PGP PRIVATE KEY BLOCK-----"
   
   SERVER_PGP_PASSPHRASE="your_passphrase_here"
   \`\`\`

2. The system will automatically use this key for server operations

#### Option B: Auto-Generate (Development Only)

1. Leave `SERVER_PGP_PRIVATE_KEY` empty
2. Call the initialization endpoint:
   \`\`\`bash
   curl -X POST http://localhost:3000/api/auth/init-server-key
   \`\`\`
3. The key will be generated and stored in the database

**Security Note**: For production, always use Option A with a securely generated key stored in environment variables, not in the database.

### 3. Monero RPC Configuration

Configure your Monero wallet RPC connection:

\`\`\`bash
MONERO_RPC_HOST=localhost  # or your onion address for Tor
MONERO_RPC_PORT=18082
MONERO_RPC_USERNAME=your_username
MONERO_RPC_PASSWORD=your_password
MONERO_USE_TOR=false  # set to true if using Tor
\`\`\`

For Tor setup, see `MONERO_SETUP.md`.

### 4. Test Your Setup

1. **Test Monero RPC Connection**:
   \`\`\`bash
   curl http://localhost:3000/api/health/monero
   \`\`\`

2. **Verify Server Key**:
   \`\`\`bash
   curl -X POST http://localhost:3000/api/auth/init-server-key
   \`\`\`

## Authentication Flow

1. **User Registration**:
   - User generates their own PGP key pair
   - User submits public key + email/password
   - Account created as "buyer" role

2. **User Login**:
   - User provides email
   - Server generates random challenge message
   - Server encrypts challenge with user's public key
   - User decrypts with their private key
   - User submits decrypted message
   - Server verifies and creates session

3. **Seller Upgrade**:
   - Buyer pays 1000 USD in XMR
   - System monitors payment
   - Upon confirmation, role upgraded to "seller"

## Escrow System

1. **Order Creation**:
   - Buyer purchases product
   - XMR payment address generated
   - Funds held in escrow

2. **Order Fulfillment**:
   - Seller marks order as "shipped"
   - Buyer receives product
   - Buyer marks as "delivered"
   - Funds released to seller

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Auto-populated by integration |
| `SUPABASE_ANON_KEY` | Yes | Auto-populated by integration |
| `SERVER_PGP_PRIVATE_KEY` | Recommended | Your server's PGP private key |
| `SERVER_PGP_PASSPHRASE` | If key encrypted | Passphrase for private key |
| `MONERO_RPC_HOST` | Yes | Monero wallet RPC host |
| `MONERO_RPC_PORT` | Yes | Monero wallet RPC port (default: 18082) |
| `MONERO_RPC_USERNAME` | Optional | RPC authentication username |
| `MONERO_RPC_PASSWORD` | Optional | RPC authentication password |
| `MONERO_USE_TOR` | Optional | Enable Tor proxy (default: false) |

## Troubleshooting

### "Missing Supabase environment variables"
- Check that Supabase integration is connected in v0
- Verify environment variables in the "Vars" section

### "Monero RPC connection failed"
- Verify `monero-wallet-rpc` is running
- Check host/port configuration
- Test with: `curl http://localhost:3000/api/health/monero`

### "Server key not found"
- Set `SERVER_PGP_PRIVATE_KEY` environment variable
- Or call `/api/auth/init-server-key` to generate one

## Security Best Practices

1. **Never commit private keys** to version control
2. **Use strong passphrases** for PGP keys
3. **Enable Tor** for Monero RPC in production
4. **Rotate keys regularly** for enhanced security
5. **Use environment variables** for all sensitive data
