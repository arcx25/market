# PGP-Authenticated Marketplace

A secure, decentralized marketplace with PGP-based authentication and XMR escrow payments.

## Features

### Authentication
- **PGP Challenge-Response**: Users authenticate by decrypting a server-encrypted challenge with their private key
- **No Traditional Passwords**: Security based on cryptographic key ownership
- **Email Verification**: Additional security layer with Supabase auth

### User Roles
- **Buyer**: Browse and purchase products, track orders, confirm delivery
- **Seller**: List products, manage inventory, fulfill orders, receive payments

### Marketplace
- **Two-Tier Categories**: Organized product browsing with parent/child categories
- **Search & Filter**: Find products by name, description, or category
- **Product Management**: Full CRUD operations for sellers

### Escrow System
- **XMR Payments**: All transactions use Monero (XMR) cryptocurrency
- **Buyer Protection**: Funds held in escrow until delivery confirmation
- **Seller Protection**: Automatic release after buyer confirmation
- **Order Tracking**: Real-time status updates (pending → paid → shipped → delivered → completed)

### Seller Upgrade
- **One-Time Fee**: $1,000 USD payable in XMR
- **Unlimited Listings**: No restrictions on product count
- **Store Management**: Custom store name and description
- **Analytics Dashboard**: Track sales and performance

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom PGP + Supabase Auth
- **Payments**: Monero RPC integration
- **Styling**: Tailwind CSS + shadcn/ui
- **Encryption**: OpenPGP.js

## Database Schema

### Core Tables
- `profiles`: User accounts with PGP keys and roles
- `vendors`: Seller store information
- `products`: Product listings with categories
- `orders`: Order records with escrow status
- `order_items`: Individual items in orders
- `categories`: Two-tier category system
- `auth_challenges`: PGP authentication challenges
- `upgrade_requests`: Seller upgrade payment tracking

## Setup

### Prerequisites
- Node.js 18+
- Supabase account
- Monero wallet daemon (for production)

### Environment Variables

**Supabase Configuration** (auto-populated by v0 integration):
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
\`\`\`

**Monero Wallet RPC Configuration**:
\`\`\`
MONERO_RPC_HOST=localhost
MONERO_RPC_PORT=18082
MONERO_RPC_USERNAME=your_rpc_username (optional)
MONERO_RPC_PASSWORD=your_rpc_password (optional)
MONERO_USE_TOR=false
\`\`\`

**Server PGP Key** (auto-generated on first use):
\`\`\`
SERVER_PGP_PRIVATE_KEY=auto_generated
\`\`\`

### Monero RPC Setup

#### Option 1: Local Wallet (Development)
1. Download and install Monero CLI wallet
2. Start wallet RPC:
   \`\`\`bash
   monero-wallet-rpc --rpc-bind-port 18082 --disable-rpc-login --wallet-file your-wallet
   \`\`\`
3. Set environment variables:
   \`\`\`
   MONERO_RPC_HOST=localhost
   MONERO_RPC_PORT=18082
   \`\`\`

#### Option 2: Tor Onion Service (Production - Recommended)

For enhanced privacy and security, use Tor for all Monero connections.

**Quick Setup:**

1. Generate onion address:
   \`\`\`bash
   cd scripts
   python3 generate_onero_address.py
   \`\`\`

2. Configure Tor (follow prompts from script):
   \`\`\`bash
   sudo cp -r tor_hidden_service /var/lib/tor/monero_rpc
   sudo chown -R debian-tor:debian-tor /var/lib/tor/monero_rpc
   sudo cat torrc.conf >> /etc/tor/torrc
   sudo systemctl restart tor
   \`\`\`

3. Start Monero wallet with Tor:
   \`\`\`bash
   monero-wallet-rpc \
     --rpc-bind-ip=127.0.0.1 \
     --rpc-bind-port=18084 \
     --confirm-external-bind \
     --wallet-file /path/to/wallet \
     --rpc-login username:password \
     --tx-proxy=tor,127.0.0.1:9050,disable_noise \
     --anonymous-inbound=youronion.onion:18084,127.0.0.1:18084
   \`\`\`

4. Set environment variables:
   \`\`\`
   MONERO_USE_TOR=true
   TOR_PROXY_HOST=127.0.0.1
   TOR_PROXY_PORT=9050
   MONERO_ONION_ADDRESS=youronion.onion
   MONERO_RPC_HOST=localhost
   MONERO_RPC_PORT=18084
   MONERO_RPC_USERNAME=username
   MONERO_RPC_PASSWORD=password
   \`\`\`

**Detailed Instructions:** See [TOR_SETUP.md](./TOR_SETUP.md) for complete configuration guide.

#### Testing Connection
Visit `/api/health/monero` to verify your Monero RPC connection is working.

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Configure environment variables (see above)
4. Run database migrations:
   \`\`\`bash
   # Execute SQL scripts in order from the scripts/ folder
   # 001_extend_schema.sql
   # 002_seed_categories.sql
   # 003_upgrade_requests.sql
   \`\`\`
5. Initialize server PGP key: `POST /api/auth/init-server-key`
6. Start development server: `npm run dev`

## Security Considerations

- Server PGP private key must be securely stored
- Monero RPC should be on a secure, isolated network
- Row Level Security (RLS) enabled on all tables
- Challenge messages expire after 5 minutes
- Payment confirmations require 10 blockchain confirmations
- Use Tor for enhanced privacy in production

## Escrow Flow

1. **Buyer purchases**: Order created with XMR payment address
2. **Payment sent**: Buyer sends XMR to escrow address
3. **Payment confirmed**: System detects payment (10 confirmations)
4. **Seller ships**: Seller marks order as shipped
5. **Seller delivers**: Seller marks order as delivered
6. **Buyer confirms**: Buyer confirms receipt
7. **Funds released**: XMR automatically transferred to seller

## API Endpoints

### Authentication
- `POST /api/auth/init-server-key` - Initialize server PGP key
- `POST /api/auth/register` - Register new user with PGP key
- `POST /api/auth/challenge` - Get authentication challenge
- `POST /api/auth/verify` - Verify challenge response

### Orders
- `POST /api/orders/create` - Create new order
- `POST /api/orders/confirm-delivery` - Buyer confirms delivery

### Seller
- `POST /api/seller/products/create` - Create product
- `PUT /api/seller/products/update` - Update product
- `DELETE /api/seller/products/delete` - Delete product
- `POST /api/seller/orders/mark-shipped` - Mark order shipped
- `POST /api/seller/orders/mark-delivered` - Mark order delivered

### Upgrade
- `POST /api/upgrade/initiate` - Start seller upgrade
- `GET /api/upgrade/check-payment` - Check payment status

### Health
- `GET /api/health/monero` - Check Monero RPC connection

## Future Enhancements

- Dispute resolution system
- Multi-signature escrow
- Reputation/rating system
- Automated payment monitoring
- Mobile app
- Additional cryptocurrency support
