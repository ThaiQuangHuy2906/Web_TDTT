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
import AIChatbot from './components/AIChatbot.jsx';
import SmartRecommendations from './components/SmartRecommendations.jsx';

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
  const [showFilters, setShowFilters] = useState(false);
  const [showTranslator, setShowTranslator] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // AI features state
  const [showChatbot, setShowChatbot] = useState(true);
  const [showRecommendations, setShowRecommendations] = useState(true);

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

    if (!poi) return;

    // Zoom to selected POI
    setCenter([poi.lat, poi.lon]);
    setZoom(19);

    console.log('🗺️ Fetching route from', origin, 'to', [poi.lat, poi.lon]);
    const routeData = await getRoute(origin, [poi.lat, poi.lon], 'driving');
    console.log('🗺️ Route data:', routeData);

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

  // Hàm xử lý khi người dùng chọn 1 gợi ý từ Smart Recommendations
  const applyRecommendedFilter = useCallback((poiType) => {
    setFilters([poiType]);
    setMessage(`🎯 Đang tìm ${poiType} gần bạn...`);
  }, []);

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
        const { latitude, longitude, accuracy } = pos.coords;
        const pt = [latitude, longitude];

        console.log('📍 GPS Location:', { latitude, longitude, accuracy });

        setOrigin(pt);
        setZoom(15);
        setSelectedPoiId(null);

        setMessage(`📍 Đã xác định vị trí (±${Math.round(accuracy)}m)`);
        setLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMsg = "❌ Không thể lấy vị trí";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = "❌ Bạn đã từ chối quyền truy cập vị trí";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = "❌ Không thể xác định vị trí (GPS không khả dụng)";
            break;
          case error.TIMEOUT:
            errorMsg = "❌ Hết thời gian chờ (hãy thử lại)";
            break;
        }

        setMessage(errorMsg);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0,
      }
    );
  }, []);

  // Styles - Modern UI
  const buttonStyle = {
    padding: '8px 14px',
    borderRadius: 10,
    border: 'none',
    background: dark
      ? 'linear-gradient(180deg, #334155 0%, #1e293b 100%)'
      : 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)',
    color: dark ? '#e2e8f0' : '#334155',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.2s ease',
    boxShadow: dark
      ? '0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)'
      : '0 1px 3px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
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
      className={dark ? 'dark' : ''}
      style={{
        display: 'grid',
        gridTemplateColumns: collapsed ? '1fr' : '1fr 360px',
        height: '100vh',
      }}
    >
      {/* Map Area */}
      <div style={{ position: 'relative', background: dark ? '#0f172a' : '#f8fafc' }}>

        {/* Top Bar - Compact with Menu */}
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 1001,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {/* Menu Button */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowMenu(v => !v)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                border: 'none',
                background: showMenu
                  ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                  : dark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)',
                color: showMenu ? '#fff' : dark ? '#f1f5f9' : '#1e293b',
                fontSize: 20,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(12px)',
                boxShadow: dark
                  ? '0 4px 15px rgba(0,0,0,0.3)'
                  : '0 4px 15px rgba(0,0,0,0.1)',
                transition: 'all 0.2s ease',
              }}
              title="Menu"
            >
              ☰
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: 52,
                  left: 0,
                  background: dark
                    ? 'rgba(15, 23, 42, 0.98)'
                    : 'rgba(255, 255, 255, 0.98)',
                  backdropFilter: 'blur(16px)',
                  borderRadius: 14,
                  border: `1px solid ${dark ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`,
                  boxShadow: dark
                    ? '0 8px 32px rgba(0,0,0,0.5)'
                    : '0 8px 32px rgba(0,0,0,0.15)',
                  padding: 8,
                  minWidth: 200,
                  animation: 'fadeIn 0.2s ease',
                }}
              >
                {/* Menu Items */}
                <button
                  onClick={() => { setShowFilters(v => !v); setShowMenu(false); }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    background: showFilters ? (dark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)') : 'transparent',
                    color: dark ? '#f1f5f9' : '#1e293b',
                    fontSize: 14,
                    fontWeight: 500,
                    textAlign: 'left',
                    borderRadius: 10,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.target.style.background = dark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(241, 245, 249, 1)'}
                  onMouseLeave={e => e.target.style.background = showFilters ? (dark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)') : 'transparent'}
                >
                  <span style={{ fontSize: 18 }}>🎯</span>
                  Bộ lọc địa điểm {filters.length > 0 && <span style={{ marginLeft: 'auto', background: '#6366f1', color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 12 }}>{filters.length}</span>}
                </button>

                <button
                  onClick={() => { locateUser(); setShowMenu(false); }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    background: 'transparent',
                    color: dark ? '#f1f5f9' : '#1e293b',
                    fontSize: 14,
                    fontWeight: 500,
                    textAlign: 'left',
                    borderRadius: 10,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.target.style.background = dark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(241, 245, 249, 1)'}
                  onMouseLeave={e => e.target.style.background = 'transparent'}
                >
                  <span style={{ fontSize: 18 }}>📍</span>
                  Vị trí của tôi
                </button>

                <button
                  onClick={() => { copyShareLink(); setShowMenu(false); }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    background: 'transparent',
                    color: dark ? '#f1f5f9' : '#1e293b',
                    fontSize: 14,
                    fontWeight: 500,
                    textAlign: 'left',
                    borderRadius: 10,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.target.style.background = dark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(241, 245, 249, 1)'}
                  onMouseLeave={e => e.target.style.background = 'transparent'}
                >
                  <span style={{ fontSize: 18 }}>🔗</span>
                  Chia sẻ link
                </button>

                <button
                  onClick={() => { setShowTranslator(v => !v); setShowMenu(false); }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    background: showTranslator ? (dark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)') : 'transparent',
                    color: dark ? '#f1f5f9' : '#1e293b',
                    fontSize: 14,
                    fontWeight: 500,
                    textAlign: 'left',
                    borderRadius: 10,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.target.style.background = dark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(241, 245, 249, 1)'}
                  onMouseLeave={e => e.target.style.background = showTranslator ? (dark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)') : 'transparent'}
                >
                  <span style={{ fontSize: 18 }}>🌐</span>
                  Dịch nhanh
                </button>

                <button
                  onClick={() => { resetMap(); setShowMenu(false); }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    background: 'transparent',
                    color: dark ? '#f1f5f9' : '#1e293b',
                    fontSize: 14,
                    fontWeight: 500,
                    textAlign: 'left',
                    borderRadius: 10,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.target.style.background = dark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(241, 245, 249, 1)'}
                  onMouseLeave={e => e.target.style.background = 'transparent'}
                >
                  <span style={{ fontSize: 18 }}>↩️</span>
                  Reset bản đồ
                </button>

                <div style={{ height: 1, background: dark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 1)', margin: '8px 0' }} />

                <button
                  onClick={() => { setDark(v => !v); setShowMenu(false); }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    background: 'transparent',
                    color: dark ? '#f1f5f9' : '#1e293b',
                    fontSize: 14,
                    fontWeight: 500,
                    textAlign: 'left',
                    borderRadius: 10,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.target.style.background = dark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(241, 245, 249, 1)'}
                  onMouseLeave={e => e.target.style.background = 'transparent'}
                >
                  <span style={{ fontSize: 18 }}>{dark ? '☀️' : '🌙'}</span>
                  {dark ? 'Chế độ sáng' : 'Chế độ tối'}
                </button>

                <button
                  onClick={() => { setCollapsed(v => !v); setShowMenu(false); }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    background: 'transparent',
                    color: dark ? '#f1f5f9' : '#1e293b',
                    fontSize: 14,
                    fontWeight: 500,
                    textAlign: 'left',
                    borderRadius: 10,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.target.style.background = dark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(241, 245, 249, 1)'}
                  onMouseLeave={e => e.target.style.background = 'transparent'}
                >
                  <span style={{ fontSize: 18 }}>{collapsed ? '»' : '«'}</span>
                  {collapsed ? 'Hiện danh sách POI' : 'Ẩn danh sách POI'}
                </button>
              </div>
            )}
          </div>

          {/* Compact Search Bar */}
          <SearchBar
            onSearch={onSearch}
            dark={dark}
          />

          {/* User Profile */}
          <UserProfile dark={dark} />
        </div>

        {/* Filter Panel - Below Search (collapsible) */}
        {showFilters && (
          <div
            style={{
              position: 'absolute',
              top: 70,
              left: 16,
              zIndex: 1000,
              width: 420,
              maxWidth: collapsed ? 'calc(100vw - 100px)' : 'calc(100vw - 420px)',
              background: dark
                ? 'rgba(15, 23, 42, 0.95)'
                : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(12px)',
              padding: 16,
              borderRadius: 14,
              border: `1px solid ${dark ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`,
              boxShadow: dark
                ? '0 4px 20px rgba(0,0,0,0.4)'
                : '0 4px 20px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}>
              <span style={{
                fontWeight: 600,
                fontSize: 14,
                color: dark ? '#f1f5f9' : '#1e293b',
              }}>
                🎯 Bộ lọc địa điểm
              </span>
              <button
                onClick={() => setShowFilters(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: dark ? '#64748b' : '#94a3b8',
                  cursor: 'pointer',
                  fontSize: 18,
                  padding: 4,
                }}
              >
                ✕
              </button>
            </div>
            <FilterBar selectedTypes={filters} onChange={setFilters} dark={dark} />
          </div>
        )}

        {/* Status Message - Bottom Left */}
        <div style={{
          position: 'absolute',
          bottom: 30,
          left: 16,
          zIndex: 999,
          fontSize: 13,
          padding: '10px 16px',
          borderRadius: 10,
          background: loading
            ? 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)'
            : (dark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)'),
          backdropFilter: 'blur(8px)',
          border: `1px solid ${loading
            ? 'transparent'
            : (dark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)')}`,
          color: loading ? '#fff' : (dark ? '#94a3b8' : '#64748b'),
          boxShadow: loading
            ? '0 4px 15px rgba(59, 130, 246, 0.4)'
            : (dark ? '0 4px 15px rgba(0,0,0,0.3)' : '0 4px 15px rgba(0,0,0,0.08)'),
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          maxWidth: 350,
        }}>
          {loading && (
            <span style={{
              display: 'inline-block',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}>⏳</span>
          )}
          {loading ? 'Đang tải…' : message}
        </div>

        <TranslatorPopup
          open={showTranslator}
          dark={dark}
          onClose={() => setShowTranslator(false)}
        />

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
      {!collapsed && (
        <div
          style={{
            borderLeft: `1px solid ${dark ? '#334155' : '#e2e8f0'}`,
            background: dark
              ? 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)'
              : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
            color: dark ? '#f1f5f9' : '#1e293b',
            padding: 16,
            overflowY: 'auto',
            width: 360,
            transition: 'all .3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <>
            <WeatherCard
              weather={weather}
              loading={weatherLoading}
              error={weatherError}
              dark={dark}
            />

            <h3 style={{
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 12,
              marginTop: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: dark ? '#f1f5f9' : '#1e293b',
            }}>
              <span style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>📌</span>
              Điểm quan tâm gần đây
              {pois.length > 0 && (
                <span style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  color: '#fff',
                  fontSize: 12,
                  padding: '2px 10px',
                  borderRadius: 12,
                  fontWeight: 600,
                }}>
                  {pois.length}
                </span>
              )}
            </h3>

            <POIList
              pois={pois}
              selectedPoiId={selectedPoiId}
              onClickItem={onSelectPoi}
              onHoverItem={(id) => setHoveredPoiId(id)}
              dark={dark}
            />
          </>
        </div>
      )}

      {/* AI Features - Only show when authenticated */}
      {showChatbot && <AIChatbot dark={dark} origin={origin} collapsed={collapsed} />}

      {showRecommendations && (
        <SmartRecommendations
          dark={dark}
          origin={origin}
          pois={pois}
          onSelectType={applyRecommendedFilter}
        />
      )}

    </div>
  );
}