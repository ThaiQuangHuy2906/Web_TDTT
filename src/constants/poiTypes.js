// Danh sách mở rộng, chia nhóm. key = tên ngắn lưu trong filters.
export const POI_TYPES = [
  {
    group: '🍽️ Ăn uống',
    items: [
      { key: 'restaurant', label: 'Nhà hàng', overpass: ['amenity=restaurant'] },
      { key: 'fast_food',  label: 'Fast food', overpass: ['amenity=fast_food'] },
      { key: 'cafe',       label: 'Cà phê',    overpass: ['amenity=cafe'] },
      { key: 'bar',        label: 'Bar',       overpass: ['amenity=bar'] },
      { key: 'pub',        label: 'Pub',       overpass: ['amenity=pub'] },
      { key: 'bakery',     label: 'Bánh ngọt', overpass: ['shop=bakery'] },
    ],
  },
  {
    group: '🛍 Mua sắm',
    items: [
      { key: 'supermarket', label: 'Siêu thị',   overpass: ['shop=supermarket'] },
      { key: 'convenience', label: 'Tiện lợi',   overpass: ['shop=convenience'] },
      { key: 'mall',        label: 'Trung tâm TM', overpass: ['shop=mall'] },
      { key: 'electronics', label: 'Điện máy',   overpass: ['shop=electronics'] },
      { key: 'mobile_phone',label: 'Điện thoại', overpass: ['shop=mobile_phone'] },
      { key: 'marketplace', label: 'Chợ',        overpass: ['amenity=marketplace'] },
    ],
  },
  {
    group: '💊 Y tế',
    items: [
      { key: 'pharmacy', label: 'Nhà thuốc', overpass: ['amenity=pharmacy'] },
      { key: 'hospital', label: 'Bệnh viện', overpass: ['amenity=hospital'] },
      { key: 'clinic',   label: 'Phòng khám', overpass: ['amenity=clinic'] },
      { key: 'dentist',  label: 'Nha khoa',   overpass: ['amenity=dentist'] },
    ],
  },
  {
    group: '🚌 Giao thông',
    items: [
      { key: 'bus_stop',         label: 'Trạm bus',         overpass: ['highway=bus_stop'] },
      { key: 'train_station',    label: 'Ga tàu',           overpass: ['railway=station'] },
      { key: 'subway_entrance',  label: 'Cửa metro',        overpass: ['railway=subway_entrance'] },
      { key: 'fuel',             label: 'Trạm xăng',        overpass: ['amenity=fuel'] },
      { key: 'parking',          label: 'Bãi đỗ xe',        overpass: ['amenity=parking'] },
      { key: 'charging_station', label: 'Sạc xe điện',      overpass: ['amenity=charging_station'] },
    ],
  },
  {
    group: '🏛 Công cộng',
    items: [
      { key: 'bank',        label: 'Ngân hàng',     overpass: ['amenity=bank'] },
      { key: 'atm',         label: 'ATM',           overpass: ['amenity=atm'] },
      { key: 'post_office', label: 'Bưu điện',      overpass: ['amenity=post_office'] },
      { key: 'police',      label: 'Công an',       overpass: ['amenity=police'] },
      { key: 'fire_station',label: 'PCCC',          overpass: ['amenity=fire_station'] },
      { key: 'toilets',     label: 'Nhà vệ sinh',   overpass: ['amenity=toilets'] },
    ],
  },
  {
    group: '🎭 Giải trí & Thể thao',
    items: [
      { key: 'cinema',         label: 'Rạp phim',        overpass: ['amenity=cinema'] },
      { key: 'theatre',        label: 'Nhà hát',         overpass: ['amenity=theatre'] },
      { key: 'fitness_centre', label: 'Gym',             overpass: ['leisure=fitness_centre'] },
      { key: 'swimming_pool',  label: 'Hồ bơi',          overpass: ['leisure=swimming_pool'] },
      { key: 'stadium',        label: 'Sân vận động',    overpass: ['leisure=stadium'] },
      { key: 'pitch',          label: 'Sân thể thao',    overpass: ['leisure=pitch'] },
    ],
  },
  {
    group: '🌿 Công viên & Du lịch',
    items: [
      { key: 'grass', label: 'Bãi cỏ', overpass: ['landuse=grass'] },
      { key: 'park',       label: 'Công viên',       overpass: ['leisure=park'] },
      { key: 'playground', label: 'Sân chơi',        overpass: ['leisure=playground'] },
      { key: 'viewpoint',  label: 'Điểm ngắm cảnh',  overpass: ['tourism=viewpoint'] },
      { key: 'museum',     label: 'Bảo tàng',        overpass: ['tourism=museum'] },
      { key: 'zoo',        label: 'Sở thú',          overpass: ['tourism=zoo'] },
      { key: 'hotel',      label: 'Khách sạn',       overpass: ['tourism=hotel'] },
      { key: 'guest_house',label: 'Nhà nghỉ',        overpass: ['tourism=guest_house'] },
    ],
  },
  {
    group: '🎓 Giáo dục',
    items: [
      { key: 'school',     label: 'Trường học',   overpass: ['amenity=school'] },
      { key: 'university', label: 'Đại học',      overpass: ['amenity=university'] },
      { key: 'library',    label: 'Thư viện',     overpass: ['amenity=library'] },
    ],
  },
  {
    group: '🚰 Nước & Tiện ích',
    items: [
      { key: 'drinking_water', label: 'Nước uống',  overpass: ['amenity=drinking_water'] },
      { key: 'fountain',       label: 'Đài phun',   overpass: ['amenity=fountain'] },
    ],
  },
]

// từ danh sách key, tạo mảng điều kiện tag cho Overpass
export function overpassSelectorsFromTypes(selectedKeys = []) {
  if (!selectedKeys.length) return null
  const clauses = []
  for (const grp of POI_TYPES) {
    for (const it of grp.items) {
      if (selectedKeys.includes(it.key)) {
        clauses.push(...it.overpass)
      }
    }
  }
  return clauses // e.g. ['amenity=cafe','amenity=restaurant', ...]
}
