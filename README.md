# Turtle Sales Management System

A full-stack web application for managing sales, timeslots, workdays, and employee tracking in an organization.

## Features

- User authentication and authorization
- Organization management
- Employee timeslot tracking
- Sales recording and leaderboards
- Workday management
- Employee paystub generation
- Real-time dashboard

## Tech Stack

### Frontend
- React 18
- Vite
- React Router
- Bootstrap
- Framer Motion
- React Hook Form
- Axios

### Backend
- Node.js
- Express
- MongoDB with Mongoose
- JWT Authentication
- Helmet (Security)
- CORS
- Rate Limiting

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB database (local or cloud)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Turtle_Sales
   ```

2. **Set up environment variables**
   
   **For the client:**
   ```bash
   cd client
   cp .env.example .env
   ```
   
   **For the server:**
   ```bash
   cd server
   cp .env.example .env
   ```

3. **Configure environment variables**
   
   **Client (.env):**
   - Update `VITE_API_URL` with your backend server URL
   - Update `VITE_CLIENT_URL` with your frontend URL
   
   **Server (.env):**
   - Update `MONGODB_URI` with your MongoDB connection string
   - Update `JWT_SECRET` with a secure secret key
   - Update `CLIENT_URL` with your frontend URL
   - Optional: Set `NETWORK_HOST` for specific network IP
   - Optional: Set `ADDITIONAL_ORIGINS` for extra CORS origins

4. **Install dependencies**
   
   **Install server dependencies:**
   ```bash
   cd server
   npm install
   ```
   
   **Install client dependencies:**
   ```bash
   cd client
   npm install
   ```

5. **Run the application**
   
   **Start the server (from server directory):**
   ```bash
   npm run dev
   # or for production
   npm start
   ```
   
   **Start the client (from client directory):**
   ```bash
   npm run dev
   ```

### Network Configuration

The application automatically detects your network IP address for CORS configuration. If you need to access the application from other devices on your network:

1. The server will display the network URL in the console when started
2. Update your client `.env` file to use the network IP if needed
3. Or set the `NETWORK_HOST` environment variable in the server `.env`

### Production Deployment

1. Set `NODE_ENV=production` in server environment
2. Build the client: `npm run build` in client directory
3. Configure production URLs in environment variables
4. Ensure proper security measures are in place

## Project Structure

```
Turtle_Sales/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   ├── utils/          # Utility functions
│   │   └── styles/         # CSS files
│   └── public/             # Static assets
├── server/                 # Express backend
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/             # MongoDB models
│   └── routes/             # API routes
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/dashboard` - Get user dashboard data

### Organization
- `POST /api/v1/organization` - Create organization
- `GET /api/v1/organization` - Get organization details
- `PUT /api/v1/organization` - Update organization

### Sales
- `GET /api/v1/sales` - Get sales data
- `POST /api/v1/sales` - Create sale record
- `GET /api/v1/sales/stats` - Get sales statistics

### Timeslots
- `GET /api/v1/timeslots` - Get timeslots
- `POST /api/v1/timeslots` - Create timeslot
- `PUT /api/v1/timeslots/:id` - Update timeslot

### Workdays
- `GET /api/v1/workdays` - Get workdays
- `POST /api/v1/workdays` - Create workday
- `PUT /api/v1/workdays/:id` - Update workday

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test your changes
5. Submit a pull request

## License

This project is licensed under the ISC License.
