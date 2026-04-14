# CarScout - MERN Car Marketplace

AI-powered car buying and selling platform built with MongoDB, Express, React, and Node.js.

## Project Structure

```text
car-scout/
|-- client/          # React + Vite frontend
`-- server/          # Express + Node.js backend
```

## Quick Start

### 1. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 2. Configure environment

Create `server/.env` and add:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
OPENAI_API_KEY=your_openai_key
```

### 3. Run the app

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 4. Load demo data

```bash
cd server && npm run seed
```

The seed script creates demo buyers, sellers, listings, inspection reports, conversations, and test-drive requests.

## Features

| Feature | Stack |
|---|---|
| Auth and roles | JWT + bcryptjs |
| Car listings and advanced filters | MongoDB + Mongoose |
| Image upload | Multer + Cloudinary |
| Real-time chat and offers | Socket.io |
| AI inspection reports | OpenAI |
| Finance estimate on listings | Frontend EMI calculator |
| Test-drive scheduling | Buyer/seller workflow + dashboard |
| Saved cars and compare shortlist | React state + API |

## API Endpoints

### Auth

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| PATCH | `/api/auth/update-password` | Change password |

### Cars

| Method | Route | Description |
|---|---|---|
| GET | `/api/cars` | List cars with filters |
| GET | `/api/cars/:id` | Get single car |
| POST | `/api/cars` | Create listing |
| PATCH | `/api/cars/:id` | Update listing |
| DELETE | `/api/cars/:id` | Delete listing |
| GET | `/api/cars/my/listings` | My listings |

### Messages

| Method | Route | Description |
|---|---|---|
| POST | `/api/messages/conversation` | Start conversation |
| GET | `/api/messages/conversations` | List conversations |
| GET | `/api/messages/:convId` | Get messages |
| POST | `/api/messages/:convId` | Send message or offer |

### Test Drives

| Method | Route | Description |
|---|---|---|
| GET | `/api/test-drives` | List my test drives |
| POST | `/api/test-drives` | Request a test drive |
| PATCH | `/api/test-drives/:id` | Confirm, complete, cancel, or reschedule |

### Inspections

| Method | Route | Description |
|---|---|---|
| POST | `/api/inspections` | Request AI inspection |
| GET | `/api/inspections/car/:carId` | Get car inspection |

### Users

| Method | Route | Description |
|---|---|---|
| GET | `/api/users/:id` | Public profile |
| PATCH | `/api/users/profile` | Update own profile |
| POST | `/api/users/save/:carId` | Toggle saved car |
| GET | `/api/users/saved/cars` | Get saved cars |

## Main Pages

| Path | Purpose |
|---|---|
| `/` | Product landing page with featured inventory |
| `/cars` | Browse and compare listings |
| `/cars/:id` | Car detail, finance estimate, inspection, test-drive request |
| `/messages` | Buyer/seller inbox |
| `/dashboard` | Profile, analytics, saved cars, test drives |
| `/list-car` | Seller listing creation/edit |

## Seed Accounts

After running `npm run seed`, use:

- `arjun.seller@carscout.dev / password123`
- `riya.seller@carscout.dev / password123`
- `harsh.seller@carscout.dev / password123`
- `neha.buyer@carscout.dev / password123`
- `karan.buyer@carscout.dev / password123`
- `admin@carscout.dev / password123`
