# OSM-VN - OpenStreetMap Vietnam Explorer

Ứng dụng bản đồ tương tác với OpenStreetMap, tìm kiếm POI (điểm quan tâm) xung quanh vị trí, tính toán tuyến đường và hiển thị thông tin thời tiết.

## 🎯 Features

- 🗺️ Bản đồ tương tác với Leaflet + OpenStreetMap
- 🔍 Tìm kiếm địa điểm (Nominatim API)
- 📍 Tìm POI xung quanh (Overpass API)
- 🛣️ Tính toán tuyến đường (OSRM)
- 🌤️ Thông tin thời tiết (OpenWeatherMap)
- 🌐 Dịch Anh-Việt (HuggingFace Translation)
- 🔐 Firebase Authentication
- 💾 Lưu lịch sử tìm kiếm (Firestore)
- 🌙 Dark mode

## 🏗️ Architecture

```
Frontend (React + Vite)
    ↓
Backend API (FastAPI) ← Exposed qua Ngrok/Pinggy
    ↓
External APIs (Nominatim, Overpass, OSRM, Weather, HuggingFace)
```

**Tại sao cần backend?**
- Centralized API management
- Hide API keys
- Rate limiting & caching
- Easier monitoring
- Better error handling

## 📋 Prerequisites

- Node.js 20+ và npm
- Python 3.10+ (cho backend)
- Firebase account (free tier)
- OpenWeatherMap API key (free)
- Ngrok account (optional, cho tunnel)

## 🚀 Quick Start

### 1. Frontend Setup

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env với Firebase keys và backend URL
nano .env

# Start dev server
npm run dev
```

### 2. Backend Setup (Choose one option)

#### Option A: Local + Ngrok (Development)
```bash
cd backend/
pip install -r requirements.txt

# Set environment
export NGROK_AUTH_TOKEN="your_token"
export WEATHER_API_KEY="your_key"

# Run with ngrok
python run_with_ngrok.py
# Copy public URL and update frontend .env
```

#### Option B: HuggingFace Spaces (Production)
```bash
# See DEPLOYMENT_GUIDE.md for full instructions
# 1. Create Space on HuggingFace
# 2. Upload backend files
# 3. Set environment variables
# 4. Copy Space URL to frontend .env
```

### 3. Firebase Setup

```bash
# Deploy Firestore rules
firebase login
firebase init firestore  # First time only
firebase deploy --only firestore:rules
```

## 📁 Project Structure

```
osm-vn/
├── src/
│   ├── components/       # React components
│   │   ├── auth/        # Login, Signup, ForgotPassword
│   │   ├── MapView.jsx
│   │   ├── SearchBar.jsx
│   │   └── ...
│   ├── contexts/        # React contexts
│   │   └── AuthContext.jsx
│   ├── hooks/           # Custom hooks
│   ├── api/             # API services
│   │   └── backendService.js  # NEW: Backend API calls
│   ├── firebase/        # Firebase config
│   └── utils/           # Utilities
├── backend/             # NEW: FastAPI backend
│   ├── main.py
│   ├── requirements.txt
│   ├── run_with_ngrok.py
│   └── Dockerfile
├── .env                 # Environment variables
└── package.json
```

## 🔧 Configuration

### Frontend `.env`
```bash
VITE_BACKEND_URL=https://your-backend-url.com
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
# ... other Firebase keys
```

### Backend Environment
```bash
WEATHER_API_KEY=your_openweathermap_key
HUGGINGFACE_TOKEN=your_hf_token  # Optional
NGROK_AUTH_TOKEN=your_ngrok_token  # If using ngrok
```

## 🧪 Testing

See `TESTING_GUIDE.md` for comprehensive testing instructions.

Quick test:
```bash
# Frontend
npm run dev
# Open http://localhost:5173

# Backend health check
curl http://localhost:7860/
# or
curl https://your-backend-url.com/
```

## 📦 Build & Deploy

### Frontend (Vercel/Netlify)
```bash
npm run build
# Upload dist/ folder to hosting

# Or use Vercel CLI
vercel --prod
```

### Backend (HuggingFace)
See `DEPLOYMENT_GUIDE.md` in artifacts for full instructions.

## 🛠️ Tech Stack

**Frontend:**
- React 19
- Vite 7
- Leaflet + React-Leaflet
- Firebase (Auth + Firestore)
- Axios

**Backend:**
- FastAPI
- httpx
- pyngrok (for tunneling)

**APIs:**
- Nominatim (geocoding)
- Overpass (POI search)
- OSRM (routing)
- OpenWeatherMap (weather)
- HuggingFace (translation)

## 🐛 Common Issues

### Backend not responding
```bash
# Check backend is running
curl http://localhost:7860/

# Check frontend .env
echo $VITE_BACKEND_URL
```

### CORS errors
Backend already configured with `allow_origins=["*"]`. If still getting errors:
- Check HTTPS vs HTTP
- Verify backend URL is correct
- Check browser console for specific error

### Firebase permission denied
```bash
# Re-deploy rules
firebase deploy --only firestore:rules
```

### Ngrok tunnel expired
Free tier expires after 8 hours. Restart:
```bash
python run_with_ngrok.py
# Update frontend .env with new URL
```

## 📚 Documentation

- `DEPLOYMENT_GUIDE.md` - Chi tiết deploy backend
- `FRONTEND_MIGRATION.md` - Hướng dẫn update frontend code
- `TESTING_GUIDE.md` - Test cases và QA
- `ERROR_HANDLING.md` - Error handling strategy

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 👥 Support

- GitHub Issues: Report bugs hoặc feature requests
- Email: your-email@example.com

## 🙏 Acknowledgments

- OpenStreetMap contributors
- Nominatim, Overpass, OSRM projects
- Firebase team
- React & Vite communities

---

**Note:** Nhớ cập nhật `VITE_BACKEND_URL` trong `.env` sau khi deploy backend!