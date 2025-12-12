import { useState, useEffect, useRef, useCallback } from 'react';
import MapView from './components/MapView.jsx';
import SearchBar from './components/SearchBar.jsx';
import POIList from './components/POIList.jsx';
import FilterBar from './components/FilterBar.jsx';
import WeatherCard from './components/WeatherCard.jsx';
import TranslatorPopup from './components/TranslatorPopup.jsx';
import UserProfile from './components/UserProfile.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';
import Login from './components/auth/Login.jsx';
import Signup from './components/auth/Signup.jsx';
import ForgotPassword from './components/auth/ForgotPassword.jsx';
import { fetchPOIsAdaptive } from './api/overpass.js';
import { readQuery, writeQuery } from './utils/url.js';
import useDebounce from './hooks/useDebounce.js';
import { searchLocation } from './api/nominatim.js';
import { getRoute } from './api/osrm.js';
import { getCurrentWeather } from './api/weather.js';
import useAuth from './hooks/useAuth.js';

export default function App() {
  const { user, loading: authLoading } = useAuth();

  // Auth UI state
  const [authScreen, setAuthScreen] = useState('login'); // 'login' | 'signup' | 'forgot'

  // Map states
  const [center, setCenter] = useState([10.7983, 106.6483]);
  const [origin, setOrigin] = useState([10.7983, 106.6483]);
  const [zoom, setZoom] = useState(13);

  // POI & UI states
  const [pois, setPois] = useState([]);
  const [selectedPoiId, setSelectedPoiId] = useState(null);
  const [hoveredPoiId, setHoveredPoiId] = useState(null);
  const [filters, setFilters] = useState([]);
  const [route, setRoute] = useState(null);

  // Weather state
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(null);

  // UI state
  const [message, setMessage] = useState('Nhập tên địa điểm để tìm kiếm...');
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState(() => {
    const q = readQuery();
    if (q.dark != null) return q.dark === '1';
    return localStorage.getItem('darkMode') === '1';
  });
  const [collapsed, setCollapsed] = useState(() => readQuery().collapsed === '1');
  const [showFilters, setShowFilters] = useState(true);
  const [showTranslator, setShowTranslator] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const fetchAbortRef = useRef(null);
  const debouncedFilters = useDebounce(filters, 400);

  // Initialize from URL
  useEffect(() => {
    const q = readQuery();
    const lat = parseFloat(q.lat);
    const lon = parseFloat(q.lon);
    if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
      const pt = [lat, lon];
      setCenter(pt);
      setOrigin(pt);
      setZoom(14);
      if (q.types) setFilters(q.types.split(',').filter(Boolean));
      setMessage('Tải từ URL…');
    }
    setHydrated(true);
  }, []);

  // Keep center following origin
  useEffect(() => {
    setCenter(origin);
  }, [origin]);

  // Clear route when origin changes
  useEffect(() => {
    setRoute(null);
  }, [origin]);

  // Write URL when origin/filters/dark/collapsed changes
  useEffect(() => {
    if (!hydrated) return;
    writeQuery({
      lat: origin[0].toFixed(6),
      lon: origin[1].toFixed(6),
      types: filters.join(','),
      dark: dark ? '1' : '0',
      collapsed: collapsed ? '1' : '0',
    });
  }, [origin, filters, dark, collapsed, hydrated]);

  // Dark mode toggle
  useEffect(() => {
    document.body.classList.toggle('dark', dark);
    localStorage.setItem('darkMode', dark ? '1' : '0');
  }, [dark]);

  // Fetch POIs when origin or filters change
  useEffect(() => {
    if (!hydrated || !origin || !user) return;

    if (fetchAbortRef.current) fetchAbortRef.current.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;

    setLoading(true);
    setMessage('🔎 Đang tải POI quanh điểm đang chấm…');

    (async () => {
      try {
        const result = await fetchPOIsAdaptive(origin, debouncedFilters, controller.signal);
        setPois(result.items);
        setMessage(
          result.items.length
            ? `✅ Có ${result.items.length} POI`
            : '⚠ Không có POI phù hợp'
        );
      } catch (err) {
        if (err.name === 'CanceledError' || err.name === 'AbortError') return;
        console.error(err);
        if (err.response?.status === 429) {
          setMessage('⚠ Server Overpass đang quá tải (429). Vui lòng thử lại sau ít phút.');
        } else {
          setMessage('❌ Lỗi khi tải POI');
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [origin, debouncedFilters, hydrated, user]);

  // Fetch weather when origin changes
  useEffect(() => {
    if (!hydrated || !origin || !user) return;

    const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
    if (!apiKey) {
      setWeather(null);
      setWeatherError('NO_API_KEY');
      setWeatherLoading(false);
      return;
    }

    let cancelled = false;
    setWeatherLoading(true);
    setWeatherError(null);

    (async () => {
      try {
        const data = await getCurrentWeather(origin[0], origin[1]);
        if (cancelled) return;
        setWeather(data);
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        if (err && err.code === 'NO_API_KEY') {
          setWeatherError('NO_API_KEY');
        } else {
          setWeatherError('FETCH_ERROR');
        }
        setWeather(null);
      } finally {
        if (!cancelled) {
          setWeatherLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [origin, hydrated, user]);

  const onSearch = useCallback(
    async (query) => {
      if (!query) return;
      setLoading(true);
      setMessage('🔎 Đang tìm địa điểm…');
      setSelectedPoiId(null);

      try {
        const location = await searchLocation(query);
        if (!location) {
          setMessage('❌ Không tìm thấy địa điểm');
          return;
        }
        const pt = [parseFloat(location.lat), parseFloat(location.lon)];
        setOrigin(pt);
        setZoom(14);
        setMessage(`📍 ${location.display_name}`);
      } catch (err) {
        console.error(err);
        setMessage('⚠ Lỗi khi tìm kiếm');
      } finally {
        setLoading(false);
      }
    },
    [filters, dark, collapsed]
  );

  const onMapClick = useCallback(
    ([lat, lon]) => {
      const pt = [lat, lon];
      setOrigin(pt);
      setSelectedPoiId(null);
      setZoom(15);
      setMessage('📍 Đang tìm POI quanh vị trí bạn vừa chọn…');
    },
    [filters, dark, collapsed]
  );

  const onSelectPoi = async (poi) => {
    setSelectedPoiId(poi?.id ?? null);
    setZoom(16);

    if (!poi) return;
    const routeData = await getRoute(origin, [poi.lat, poi.lon], 'driving');

    if (routeData) {
      setRoute(routeData);
      setMessage(
        `🚗 Khoảng cách: ${(routeData.distance / 1000).toFixed(2)} km — 
       Thời gian: ${(routeData.duration / 60).toFixed(1)} phút`
      );
    } else {
      setRoute(null);
    }
  };

  const resetMap = useCallback(() => {
    setCenter(origin);
    setZoom(14);
    setSelectedPoiId(null);
    setHoveredPoiId(null);
    setRoute(null);
    setPois([]);
    setMessage('↩️ Đã quay về điểm gốc');
  }, [origin]);

  const copyShareLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setMessage('🔗 Đã sao chép link chia sẻ');
    } catch {
      setMessage('⚠ Không sao chép được link');
    }
  }, []);

  const locateUser = useCallback(() => {
    if (!navigator.geolocation) {
      setMessage("⚠️ Trình duyệt không hỗ trợ định vị");
      return;
    }

    setMessage("⏳ Đang xác định vị trí…");
    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const pt = [latitude, longitude];

        setOrigin(pt);
        setZoom(15);
        setSelectedPoiId(null);

        setMessage("📍 Đã xác định vị trí hiện tại");
        setLoading(false);
      },
      () => {
        setMessage("❌ Không thể lấy vị trí (bạn có từ chối cấp quyền?)");
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  // Styles
  const buttonStyle = {
    padding: '6px 10px',
    borderRadius: 8,
    border: `1px solid ${dark ? '#404040' : '#d1d5db'}`,
    background: dark ? '#1b1b1b' : '#f3f4f6',
    color: dark ? '#e5e7eb' : '#111',
    cursor: 'pointer',
  };

  // ============================================
  // AUTH FLOW: Show loading or auth screens if not authenticated
  // ============================================

  if (authLoading) {
    return <LoadingScreen dark={dark} />;
  }

  if (!user) {
    // Show auth screens
    if (authScreen === 'signup') {
      return (
        <Signup
          dark={dark}
          onSwitchToLogin={() => setAuthScreen('login')}
        />
      );
    }

    if (authScreen === 'forgot') {
      return (
        <ForgotPassword
          dark={dark}
          onBackToLogin={() => setAuthScreen('login')}
        />
      );
    }

    // Default: login screen
    return (
      <Login
        dark={dark}
        onSwitchToSignup={() => setAuthScreen('signup')}
        onSwitchToForgotPassword={() => setAuthScreen('forgot')}
      />
    );
  }

  // ============================================
  // MAIN APP: User is authenticated
  // ============================================

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: collapsed ? '1fr 12px' : '1fr 320px',
        height: '100vh',
      }}
    >
      {/* Map Area */}
      <div style={{ position: 'relative', background: dark ? '#0b0b0b' : '#fff' }}>
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            zIndex: 1000,
            backgroundColor: dark ? '#111' : '#fff',
            color: dark ? '#e5e7eb' : '#111',
            padding: '10px',
            borderRadius: 8,
            border: `1px solid ${dark ? '#2a2a2a' : '#e5e7eb'}`,
            boxShadow: dark ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            <SearchBar
              onSearch={onSearch}
              dark={dark}
            />

            <button style={buttonStyle} onClick={() => setShowFilters((v) => !v)}>
              {showFilters ? `Ẩn bộ lọc (${filters.length})` : `Bộ lọc (${filters.length})`}
            </button>

            <button style={buttonStyle} onClick={resetMap}>
              ↩️ Reset
            </button>

            <button style={buttonStyle} onClick={locateUser}>
              📍 Vị trí của tôi
            </button>

            <button style={buttonStyle} onClick={copyShareLink}>
              🔗 Copy link
            </button>

            <button style={buttonStyle} onClick={() => setShowTranslator(v => !v)}>
              🌐 Dịch nhanh
            </button>

            <button style={buttonStyle} onClick={() => setDark((v) => !v)}>
              {dark ? '☀️ Light' : '🌙 Dark'}
            </button>

            <button style={buttonStyle} onClick={() => setCollapsed((v) => !v)}>
              {collapsed ? '» Mở' : '« Thu gọn'}
            </button>

            {/* User Profile Component */}
            <UserProfile dark={dark} />
          </div>

          {showFilters && <FilterBar selectedTypes={filters} onChange={setFilters} />}

          <div style={{ fontSize: 12, marginTop: 6 }}>
            {loading ? '⏳ Đang tải…' : message}
          </div>

          <TranslatorPopup
            open={showTranslator}
            dark={dark}
            onClose={() => setShowTranslator(false)}
          />
        </div>

        <MapView
          center={center}
          origin={origin}
          zoom={zoom}
          pois={pois}
          onMapClick={onMapClick}
          selectedPoiId={selectedPoiId}
          hoveredPoiId={hoveredPoiId}
          dark={dark}
          route={route}
        />
      </div>

      {/* Sidebar */}
      <div
        style={{
          borderLeft: `1px solid ${dark ? '#333' : '#ddd'}`,
          background: dark ? '#1e1e1e' : '#fff',
          color: dark ? '#f1f1f1' : '#111',
          padding: collapsed ? 0 : 10,
          overflowY: 'auto',
          width: collapsed ? 12 : 320,
          transition: 'all .3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
        }}
      >
        {!collapsed && (
          <>
            <WeatherCard
              weather={weather}
              loading={weatherLoading}
              error={weatherError}
              dark={dark}
            />

            <h3>📌 Điểm quan tâm gần đây</h3>

            <POIList
              pois={pois}
              selectedPoiId={selectedPoiId}
              onClickItem={onSelectPoi}
              onHoverItem={(id) => setHoveredPoiId(id)}
              dark={dark}
            />
          </>
        )}
      </div>
    </div>
  );
}