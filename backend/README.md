# Marriage Project Backend (Khubool Hai)

Node.js + Express + MongoDB API for the marriage matchmaking app.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and update values:
   ```bash
   cp .env.example .env
   ```

3. Ensure MongoDB is running (local or Atlas connection string in `MONGODB_URI`).

4. Start the server:
   ```bash
   npm run dev    # development with watch
   npm start      # production
   ```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (requires Bearer token)

### Profiles
- `POST /api/profiles` - Create/update profile (auth required)
- `GET /api/profiles/me` - Get my profile (auth required)
- `GET /api/profiles/list` - List profiles (query: tier, search, state, gender, page, limit)
- `GET /api/profiles/:id` - Get profile by ID or profileId

### Health
- `GET /api/health` - Health check
