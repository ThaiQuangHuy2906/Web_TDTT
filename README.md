# 🗺️ OSM Vietnam - Bản đồ Việt Nam thông minh

Ứng dụng bản đồ Việt Nam sử dụng OpenStreetMap với các tính năng AI thông minh.

![React](https://img.shields.io/badge/React-19.1-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?logo=vite)
![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?logo=firebase)
![Leaflet](https://img.shields.io/badge/Leaflet-Maps-199900?logo=leaflet)

## ✨ Tính năng

### 🗺️ Bản đồ
- Hiển thị bản đồ OpenStreetMap với dark/light mode
- Tìm kiếm địa điểm (Nominatim API)
- Hiển thị tuyến đường (OSRM API)
- Click để chọn vị trí, xem POI xung quanh

### 📍 POI (Điểm quan tâm)
- Hiển thị nhà hàng, quán cà phê, khách sạn, bệnh viện, ATM...
- Bộ lọc theo loại địa điểm
- Khoảng cách và thời gian di chuyển

### 🤖 AI Features
- **AI Chatbot**: Trợ lý du lịch thông minh
- **Smart Recommendations**: Gợi ý địa điểm dựa trên sở thích

### 🌤️ Thời tiết
- Hiển thị thời tiết hiện tại (OpenWeatherMap API)

### 👤 Tài khoản
- Đăng nhập/Đăng ký với Firebase Auth
- Lưu lịch sử tìm kiếm trên Firestore

## 🚀 Cài đặt

```bash
# Clone repo
git clone https://github.com/your-username/osm-vn.git
cd osm-vn

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev
```

## ⚙️ Cấu hình

Tạo file `.env` với các biến môi trường:

```env
# Firebase
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# OpenWeatherMap (optional)
VITE_WEATHER_API_KEY=your_openweather_key

# Backend AI (optional)
VITE_BACKEND_URL=http://localhost:7860
```

## 📁 Cấu trúc dự án

```
src/
├── api/           # API clients (Nominatim, OSRM, Overpass, Weather, Backend)
├── components/    # React components
│   ├── auth/      # Login, Signup, ForgotPassword
│   ├── AIChatbot.jsx
│   ├── MapView.jsx
│   ├── POIList.jsx
│   ├── SearchBar.jsx
│   └── ...
├── contexts/      # React contexts (AuthContext)
├── firebase/      # Firebase config & Firestore
├── hooks/         # Custom hooks
└── utils/         # Utility functions
```

## 🔧 Scripts

```bash
npm run dev      # Development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 🛠️ Tech Stack

- **Frontend**: React 19.1, Vite 7.2
- **Maps**: Leaflet, React-Leaflet
- **Auth**: Firebase Authentication
- **Database**: Cloud Firestore
- **APIs**: OpenStreetMap, OSRM, Nominatim, OpenWeatherMap
- **Styling**: CSS-in-JS, Modern gradients

## 📄 License

MIT License

---

Made with ❤️ in Vietnam 🇻🇳