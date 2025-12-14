# 🕹️ 4 in a Row - Real-Time Multiplayer Game

A real-time multiplayer Connect 4 game built with React, Node.js, Express, Socket.IO, and MongoDB. Players can compete against each other or play against an intelligent bot.

## 🎮 Features

- **Real-time Gameplay**: WebSocket-based real-time multiplayer experience
- **Player Matchmaking**: Automatic matchmaking with 10-second timeout
- **Competitive Bot**: Intelligent AI opponent with strategic decision-making
- **Reconnection Support**: Rejoin games within 30 seconds if disconnected
- **Leaderboard**: Track wins, losses, and statistics
- **Game History**: View past games and performance

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (local instance or MongoDB Atlas account)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "game app - Copy"
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the `backend` directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:5173
```

**Example MongoDB URI:**
- Local: `mongodb://localhost:27017/four-in-a-row`
- Atlas: `mongodb+srv://username:password@cluster.mongodb.net/four-in-a-row?retryWrites=true&w=majority`

### 3. Frontend Setup

Navigate to the frontend directory:

```bash
cd ../frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the `frontend` directory (optional, defaults are provided):

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## 🏃 Running the Application

### Development Mode

#### Start the Backend Server

From the `backend` directory:

```bash
npm run dev
```

The backend server will start on `http://localhost:5000`

#### Start the Frontend Development Server

From the `frontend` directory:

```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

### Production Mode

#### Build the Frontend

From the `frontend` directory:

```bash
npm run build
```

#### Start the Backend (Production)

From the `backend` directory:

```bash
npm start
```

## 🎯 How to Play

1. **Enter Your Username**: Enter a unique username to start playing
2. **Quick Match**: Click "Quick Match" to find an opponent
   - If no opponent joins within 10 seconds, you'll play against a bot
3. **Make Moves**: Click on a column to drop your disc
4. **Win Condition**: Connect 4 discs vertically, horizontally, or diagonally
5. **View Leaderboard**: Check your ranking and statistics

## 🏗️ Project Structure

```
game app - Copy/
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Custom middleware
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   │   ├── botService.js       # AI bot logic
│   │   ├── gameLogic.js        # Game rules
│   │   └── matchmakingService.js # Matchmaking logic
│   ├── sockets/         # Socket.IO handlers
│   ├── server.js        # Entry point
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/  # React components
    │   ├── constants/   # Game constants
    │   ├── hooks/       # Custom React hooks
    │   ├── utils/       # Utility functions
    │   └── App.jsx      # Main component
    ├── package.json
    └── vite.config.js
```

## 🔧 Configuration

### Backend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | Required |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:5173` |

### Frontend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | WebSocket server URL | `http://localhost:5000` |

## 🎮 Game Rules

- **Grid Size**: 7 columns × 6 rows
- **Objective**: Connect 4 discs in a row (vertical, horizontal, or diagonal)
- **Turns**: Players take turns dropping discs into columns
- **Time Limit**: 30 seconds per move
- **Disconnection**: 30-second window to reconnect before forfeit
- **Draw**: Game ends in a draw if the board fills without a winner

## 🤖 Bot Intelligence

The bot uses:
- **Minimax Algorithm** with alpha-beta pruning
- **Strategic Decision Making**:
  - Prioritizes winning moves
  - Blocks opponent's winning moves
  - Creates winning opportunities
  - Controls center columns

## 📡 API Endpoints

### Health Check
```
GET /health
```

### Leaderboard
```
GET /api/leaderboard?limit=10&sortBy=wins
GET /api/leaderboard/rank/:username
```

### Game Stats
```
GET /api/game/stats/:username
GET /api/game/history/:username
```

## 🐛 Troubleshooting

### Backend Issues

**MongoDB Connection Error**
- Verify your `MONGODB_URI` is correct
- Check if MongoDB is running (for local instances)
- Ensure network access is enabled (for Atlas)

**Port Already in Use**
- Change the `PORT` in `.env` file
- Or kill the process using port 5000

### Frontend Issues

**Cannot Connect to Backend**
- Verify backend is running on the correct port
- Check `VITE_API_URL` and `VITE_SOCKET_URL` in `.env`
- Ensure CORS is properly configured

**WebSocket Connection Failed**
- Check if backend server is running
- Verify `VITE_SOCKET_URL` matches backend URL
- Check browser console for specific errors

## 📝 Scripts

### Backend
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🚀 Deployment

### Backend Deployment (Render/Railway/Heroku)

1. Set environment variables in your hosting platform
2. Ensure MongoDB is accessible
3. Deploy the backend service
4. Note the deployed URL

### Frontend Deployment (Vercel/Netlify)

1. Set environment variables:
   - `VITE_API_URL` - Your deployed backend API URL
   - `VITE_SOCKET_URL` - Your deployed backend WebSocket URL
2. Build and deploy the frontend
3. Update backend `CLIENT_URL` to match frontend URL

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📧 Support

For support, please open an issue in the repository.

---

**Enjoy playing 4 in a Row! 🎉**

