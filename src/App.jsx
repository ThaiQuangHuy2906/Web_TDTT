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
  const [authScreen, setAuthScreen] = useState('login'); // 'login' | 'signup' | 'forgot'

  const [center, setCenter] = useState([10.7983, 106.6483]);
  const [origin, setOrigin] = useState([10.7983, 106.6483]);
  const [zoom, setZoom] = useState(13);

  const [pois, setPois] = useState([]);
  const [selectedPoiId, setSelectedPoiId] = useState(null);
  const [hoveredPoiId, setHoveredPoiId] = useState(null);
  const [filters, setFilters] = useState([]);
  const [route, setRoute] = useState(null);

  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(null);

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

  // ---- Init from URL
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

  useEffect(() => {
    setCenter(origin);
  }, [origin]);

  useEffect(() => {
    setRoute(null);
  }, [origin]);

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

  useEffect(() => {
    document.body.classList.toggle('dark', dark);
    localStorage.setItem('darkMode', dark ? '1' : '0');
  }, [dark]);

  // ---- Fetch POI
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

  // ---- Fetch weather
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
        if (!cancelled) setWeatherLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [origin, hydrated, user]);

  // ---- Handlers
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
        `🚗 Khoảng cách: ${(routeData.distance / 1000).toFixed(2)} km — Thời gian: ${(routeData.duration / 60).toFixed(1)} phút`
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
      setMessage('⚠️ Trình duyệt không hỗ trợ định vị');
      return;
    }

    setMessage('⏳ Đang xác định vị trí…');
    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const pt = [latitude, longitude];

        setOrigin(pt);
        setZoom(15);
        setSelectedPoiId(null);

        setMessage('📍 Đã xác định vị trí hiện tại');
        setLoading(false);
      },
      () => {
        setMessage('❌ Không thể lấy vị trí (bạn có từ chối cấp quyền?)');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  // ---- Styles
  const panelStyle = {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    zIndex: 1000,
    maxWidth: 'calc(100vw - 360px)',
    backgroundColor: dark ? 'rgba(17, 17, 17, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(12px)',
    padding: 16,
    borderRadius: 16,
    border: `1px solid ${dark ? 'rgba(42, 42, 42, 0.8)' : 'rgba(229, 231, 235, 0.8)'}`,
    boxShadow: dark
      ? '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)'
      : '0 8px 32px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0,0,0,0.02)',
  };

  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    borderRadius: 10,
    border: 'none',
    background: dark
      ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)'
      : 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
    color: dark ? '#e5e7eb' : '#111',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    border: `1px solid ${dark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
  };

  const activeButtonStyle = {
    ...buttonStyle,
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    color: '#fff',
    border: 'none',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
  };

  const asideStyle = {
    borderLeft: `1px solid ${dark ? '#333' : '#ddd'}`,
    background: dark ? '#0f0f0f' : '#fafafa',
    padding: collapsed ? 0 : 16,
    overflowY: 'auto',
    width: collapsed ? 12 : 340,
    transition: 'all .3s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
  };

  // ---- Auth screens
  if (authLoading) return <LoadingScreen dark={dark} />;

  if (!user) {
    if (authScreen === 'signup') {
      return <Signup dark={dark} onSwitchToLogin={() => setAuthScreen('login')} />;
    }
    if (authScreen === 'forgot') {
      return <ForgotPassword dark={dark} onBackToLogin={() => setAuthScreen('login')} />;
    }
    return (
      <Login
        dark={dark}
        onSwitchToSignup={() => setAuthScreen('signup')}
        onSwitchToForgotPassword={() => setAuthScreen('forgot')}
      />
    );
  }

  // ---- Main app
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: collapsed ? '1fr 12px' : '1fr 340px',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'relative', background: dark ? '#0b0b0b' : '#fff' }}>
        <div style={panelStyle}>
          {/* ===== KHỐI CONTROL TRÊN CÙNG ===== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* HÀNG 1: Search + buttons + (email nếu ẨN sidebar) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <SearchBar onSearch={onSearch} dark={dark} />

              <button
                style={showFilters ? activeButtonStyle : buttonStyle}
                onClick={() => setShowFilters((v) => !v)}
              >
                🎯 Lọc ({filters.length})
              </button>

              <button style={buttonStyle} onClick={resetMap}>
                ↻ Reset
              </button>

              <button style={buttonStyle} onClick={locateUser}>
                📍 Vị trí
              </button>

              <button style={buttonStyle} onClick={copyShareLink}>
                🔗 Chia sẻ
              </button>

              <button style={buttonStyle} onClick={() => setShowTranslator((v) => !v)}>
                🌐 Dịch
              </button>

              <button
                style={dark ? activeButtonStyle : buttonStyle}
                onClick={() => setDark((v) => !v)}
              >
                {dark ? '☀️' : '🌙'}
              </button>

              {/* Nút ẩn/hiện sidebar */}
              <button style={buttonStyle} onClick={() => setCollapsed((v) => !v)}>
                {collapsed ? '▶' : '◀'}
              </button>

              {/* Khi sidebar ẨN → email ở HÀNG 1, bên phải nút ▶ */}
              {collapsed && <UserProfile dark={dark} />}
            </div>

            {/* Khi sidebar HIỆN → email nhảy xuống HÀNG 2, dưới ô Search */}
            {!collapsed && (
              <div>
                <UserProfile dark={dark} />
              </div>
            )}
          </div>

          {/* ===== Filter panel ===== */}
          {showFilters && (
            <div
              style={{
                padding: 12,
                borderRadius: 12,
                background: dark ? 'rgba(30, 30, 30, 0.6)' : 'rgba(249, 250, 251, 0.8)',
                border: `1px solid ${dark ? 'rgba(64, 64, 64, 0.5)' : 'rgba(229, 231, 235, 0.5)'
                  }`,
              }}
            >
              <FilterBar selectedTypes={filters} onChange={setFilters} />
            </div>
          )}

          {/* ===== Status message ===== */}
          <div
            style={{
              fontSize: 13,
              marginTop: 10,
              padding: '8px 12px',
              borderRadius: 8,
              background: dark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
              color: dark ? '#ffffff' : '#1e40af',
              border: `1px solid ${dark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'
                }`,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {loading && (
              <span
                style={{
                  display: 'inline-block',
                  width: 12,
                  height: 12,
                  border: `2px solid ${dark ? '#3b82f6' : '#2563eb'}`,
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
            )}
            <span>{loading ? 'Đang tải...' : message}</span>
          </div>

          <style>
            {`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}
          </style>

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

      {/* Sidebar: Điểm quan tâm gần đây */}
      <div style={asideStyle}>
        {!collapsed && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <WeatherCard
              weather={weather}
              loading={weatherLoading}
              error={weatherError}
              dark={dark}
            />

            <div
              style={{
                padding: 16,
                borderRadius: 16,
                background: dark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                border: `1px solid ${dark ? 'rgba(64, 64, 64, 0.5)' : 'rgba(229, 231, 235, 0.5)'
                  }`,
                boxShadow: dark
                  ? '0 4px 16px rgba(0, 0, 0, 0.3)'
                  : '0 4px 16px rgba(0, 0, 0, 0.08)',
              }}
            >
              <h3
                style={{
                  margin: '0 0 16px 0',
                  fontSize: 18,
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                📌 Điểm quan tâm gần đây
              </h3>

              <POIList
                pois={pois}
                selectedPoiId={selectedPoiId}
                onClickItem={onSelectPoi}
                onHoverItem={(id) => setHoveredPoiId(id)}
                dark={dark}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
