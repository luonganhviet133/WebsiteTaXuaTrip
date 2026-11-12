import { escapeHtml } from '../utils/escapeHtml.ts';
import { buildLandmarkTooltipHtml, buildListingTooltipHtml } from '../utils/mapTooltipHtml.ts';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Navigation,
  CloudSun,
  Phone,
  Route,
  Search,
  X,
  Compass,
  ExternalLink,
  Sparkles,
  Maximize2,
  Minimize2,
  MapPin,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { Listing, CloudLandmark, LocationArea } from '../types/index.ts';
import {
  formatVND,
  calculateDistanceKm,
  estimateMountainTravelMinutes
} from '../utils/rules.ts';

interface InteractiveMapSectionProps {
  listings: Listing[];
  landmarks: CloudLandmark[];
  onSelectListing: (listing: Listing) => void;
}

type MapFilterType =
  | 'all'
  | 'landmarks'
  | 'homestay'
  | 'coffee_food'
  | 'transport'
  | 'tour_photo'
  | 'rescue';

type MapTileMode = 'osm' | 'topo' | 'dark';

interface CloudHuntingRoute {
  id: string;
  shortName: string;
  title: string;
  distanceLabel: string;
  durationLabel: string;
  difficultyLabel: string;
  color: string;
  areas: LocationArea[];
  coordinates: [number, number][];
  advice: string;
}

const CLOUD_HUNTING_ROUTES: CloudHuntingRoute[] = [
  {
    id: 'route-dinh-gio-khe-cai',
    shortName: '🌅 Cung 1: Đỉnh Gió – Mị Ơi – Khe Cải',
    title: 'Cung Bình Minh & Hoàng Hôn Trung Tâm (Đỉnh Gió – Bản Khe Cải)',
    distanceLabel: '3.5 km',
    durationLabel: '~10 phút xe máy',
    difficultyLabel: 'Đường dễ · Ô tô 16 chỗ vào tận nơi',
    color: '#0d9488',
    areas: ['Đỉnh Gió', 'Khe Cải', 'Trung Tâm Tà Xùa'],
    coordinates: [
      [21.3245, 104.4832], // Ngã ba Trung tâm Tà Xùa
      [21.3278, 104.4775], // Đỉnh Gió
      [21.3188, 104.4685]  // Bản Khe Cải
    ],
    advice:
      'Tuyến săn mây & hoàng hôn 180° thuận tiện nhất, tập trung chuỗi cà phê mép vực (Mị Ơi, Hiên, Bản, Nhà Của An) và các homestay cabin kính.'
  },
  {
    id: 'route-song-lung',
    shortName: '🦖 Cung 2: Trung Tâm – Sống Lưng – Háng Đồng',
    title: 'Cung Đại Ngàn Săn Biển Mây (Trung Tâm – Sống Lưng Khủng Long)',
    distanceLabel: '13 km',
    durationLabel: '~30 phút xe máy',
    difficultyLabel: 'Đèo dốc · Nên đi xe số khỏe / xe ôm bản địa',
    color: '#ea580c',
    areas: ['Trung Tâm Tà Xùa', 'Sống Lưng Khủng Long', 'Háng Đồng'],
    coordinates: [
      [21.3245, 104.4832], // Trung tâm Tà Xùa
      [21.3390, 104.4960], // Đèo Bê Tông
      [21.3540, 104.5045], // Cổng chào Háng Đồng
      [21.3695, 104.5132]  // Sống Lưng Khủng Long
    ],
    advice:
      'Thung lũng giữ biển mây dày và lâu tan nhất Tà Xùa (05:15 – 08:00 sáng). Khuyến nghị kiểm tra phanh xe số hoặc đặt tài xế bản địa nếu đi sáng sớm.'
  },
  {
    id: 'route-thao-nguyen',
    shortName: '🌿 Cung 3: Thảo Nguyên – Cá Heo – Cây Cô Đơn',
    title: 'Cung Đồi Cỏ & Hoàng Hôn (Thảo Nguyên – Mỏm Cá Heo – Cây Cô Đơn)',
    distanceLabel: '11 km',
    durationLabel: '~22 phút xe máy',
    difficultyLabel: 'Đường nhựa đẹp · Dễ chạy xe ga & xe số',
    color: '#2563eb',
    areas: ['Trung Tâm Tà Xùa', 'Thảo Nguyên', 'Mống Vàng'],
    coordinates: [
      [21.3245, 104.4832], // Trung tâm Tà Xùa
      [21.3355, 104.4720], // Mống Vàng
      [21.3510, 104.4620], // Thảo Nguyên Tà Xùa
      [21.3585, 104.4565]  // Cây Cô Đơn - Gió Tà Xùa
    ],
    advice:
      'Cung đường nhựa êm ái hướng Thủy điện Suối Sập, lý tưởng để dạo chiều săn nắng vàng, chụp ảnh đồi cỏ Thảo Nguyên và ngắm hoàng hôn Cây Cô Đơn.'
  }
];

/**
 * Thuật toán Golden-Angle Spiral Offset:
 * Phân tách các cơ sở có tọa độ trùng hoặc quá sát nhau trong cùng khu vực
 * để 100% ghim trên bản đồ đều tách rời, dễ nhìn và bấm chọn được.
 */
function spreadOverlappingCoordinates(
  items: Listing[],
  landmarks: CloudLandmark[]
): Map<string, { lat: number; lng: number }> {
  const result = new Map<string, { lat: number; lng: number }>();
  const buckets = new Map<string, Listing[]>();

  items.forEach((item) => {
    // Gom nhóm các tọa độ trùng hoặc cách nhau < ~100m
    const key = `${Math.round(item.coordinates.lat * 850)}_${Math.round(
      item.coordinates.lng * 850
    )}`;
    const group = buckets.get(key) || [];
    group.push(item);
    buckets.set(key, group);
  });

  const goldenAngle = 2.399963229728653; // ~137.508 độ (radian)
  const baseStepLat = 0.00125; // ~135m mỗi vòng xoắn
  const baseStepLng = 0.00135; // hiệu chỉnh cos(21.33°)

  buckets.forEach((group) => {
    if (group.length === 1) {
      const single = group[0];
      const nearLandmark = landmarks.some(
        (lm) =>
          Math.abs(lm.coordinates.lat - single.coordinates.lat) < 0.0012 &&
          Math.abs(lm.coordinates.lng - single.coordinates.lng) < 0.0012
      );
      if (!nearLandmark) {
        result.set(single.id, {
          lat: single.coordinates.lat,
          lng: single.coordinates.lng
        });
        return;
      }
    }

    // Kiểm tra xem tâm cụm này có trùng với nhãn Tọa độ săn mây không
    const centerLat = group[0].coordinates.lat;
    const centerLng = group[0].coordinates.lng;
    const overlapsLandmark = landmarks.some(
      (lm) =>
        Math.abs(lm.coordinates.lat - centerLat) < 0.0015 &&
        Math.abs(lm.coordinates.lng - centerLng) < 0.0015
    );

    group.forEach((item, index) => {
      // Nếu trùng tâm với nhãn Điểm Săn Mây, đẩy vòng xoắn bắt đầu từ n = index + 2
      // để chừa khoảng trống trung tâm cho nhãn Điểm Săn Mây
      const spiralIdx = overlapsLandmark ? index + 2 : index;
      if (spiralIdx === 0) {
        result.set(item.id, {
          lat: item.coordinates.lat,
          lng: item.coordinates.lng
        });
        return;
      }

      const radiusFactor = Math.sqrt(spiralIdx);
      const angle = spiralIdx * goldenAngle;
      const offsetLat = baseStepLat * radiusFactor * Math.sin(angle);
      const offsetLng = baseStepLng * radiusFactor * Math.cos(angle);

      result.set(item.id, {
        lat: Number((item.coordinates.lat + offsetLat).toFixed(6)),
        lng: Number((item.coordinates.lng + offsetLng).toFixed(6))
      });
    });
  });

  return result;
}

export const InteractiveMapSection: React.FC<InteractiveMapSectionProps> = ({
  listings,
  landmarks,
  onSelectListing
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const cloudRouteLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const userLocationMarkerRef = useRef<L.Marker | null>(null);

  const [activeFilter, setActiveFilter] = useState<MapFilterType>('all');
  const [mapStyle, setMapStyle] = useState<MapTileMode>('osm');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyCloudView, setOnlyCloudView] = useState<boolean>(false);
  const [onlyNearbyRadius, setOnlyNearbyRadius] = useState<boolean>(false);
  const [activeCloudRouteId, setActiveCloudRouteId] = useState<string | null>(null);
  const [isMapExpanded, setIsMapExpanded] = useState<boolean>(false);
  const [gpsStatusMessage, setGpsStatusMessage] = useState<string | null>(null);

  const [selectedLandmark, setSelectedLandmark] = useState<CloudLandmark | null>(
    landmarks[0] || null
  );
  const [selectedMapListing, setSelectedMapListing] = useState<Listing | null>(null);
  const [targetCloudSpotId, setTargetCloudSpotId] = useState<string>(
    landmarks[0]?.id || 'spot-dinh-gio'
  );

  // Store latest callbacks in ref so Leaflet markers never use stale handlers
  const callbacksRef = useRef({
    onSelectListing,
    setSelectedLandmark,
    setSelectedMapListing
  });
  callbacksRef.current = {
    onSelectListing,
    setSelectedLandmark,
    setSelectedMapListing
  };

  const getCategoryEmoji = (cat: string) => {
    switch (cat) {
      case 'homestay':
        return '🏡';
      case 'coffee':
        return '☕';
      case 'restaurant':
        return '🍲';
      case 'tour':
        return '🥾';
      case 'motorbike':
        return '🛵';
      case 'bus':
        return '🚌';
      case 'taxi':
        return '🚕';
      case 'photo':
      case 'costume':
      case 'camera':
        return '📸';
      case 'rescue':
        return '🚨';
      default:
        return '📍';
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'homestay':
        return 'Homestay';
      case 'coffee':
        return 'Quán Cafe';
      case 'restaurant':
        return 'Nhà hàng & Lẩu';
      case 'tour':
        return 'Tour Trekking';
      case 'motorbike':
        return 'Thuê xe máy';
      case 'bus':
        return 'Nhà xe Limousine/Cabin';
      case 'taxi':
        return 'Taxi 24/7';
      case 'photo':
      case 'costume':
      case 'camera':
        return 'Chụp ảnh & Thiết bị';
      case 'rescue':
        return 'Cứu hộ 24/7';
      default:
        return 'Dịch vụ';
    }
  };

  // Tâm tham chiếu hiện tại để đo khoảng cách & lọc bán kính < 3km
  const activeReferenceSpot = useMemo(() => {
    if (selectedLandmark) return selectedLandmark;
    return landmarks.find((l) => l.id === targetCloudSpotId) || landmarks[0] || null;
  }, [selectedLandmark, landmarks, targetCloudSpotId]);

  const activeCloudRoute = useMemo(
    () => CLOUD_HUNTING_ROUTES.find((r) => r.id === activeCloudRouteId) || null,
    [activeCloudRouteId]
  );

  // Lọc danh sách cơ sở đồng bộ cho cả Bản Đồ và Danh Sách Cột Phải
  const filteredListings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return listings
      .filter((item) => {
        // 1. Lọc theo danh mục
        if (activeFilter === 'landmarks') return false;
        if (activeFilter === 'homestay' && item.category !== 'homestay') return false;
        if (
          activeFilter === 'coffee_food' &&
          item.category !== 'coffee' &&
          item.category !== 'restaurant'
        ) {
          return false;
        }
        if (
          activeFilter === 'transport' &&
          item.category !== 'motorbike' &&
          item.category !== 'taxi' &&
          item.category !== 'bus'
        ) {
          return false;
        }
        if (
          activeFilter === 'tour_photo' &&
          item.category !== 'tour' &&
          item.category !== 'photo' &&
          item.category !== 'costume' &&
          item.category !== 'camera'
        ) {
          return false;
        }
        if (activeFilter === 'rescue' && item.category !== 'rescue') {
          return false;
        }

        // 2. Lọc theo Cung đường săn mây đang chọn (nếu có)
        if (activeCloudRoute && !activeCloudRoute.areas.includes(item.area)) {
          return false;
        }

        // 3. Lọc nhanh View Biển Mây
        if (onlyCloudView && !item.hasCloudView) {
          return false;
        }

        // 4. Lọc bán kính < 3km quanh tọa độ săn mây đang chọn
        if (onlyNearbyRadius && activeReferenceSpot) {
          const dist = calculateDistanceKm(
            item.coordinates,
            activeReferenceSpot.coordinates
          );
          if (dist > 3.2) return false;
        }

        // 5. Lọc theo từ khóa tìm kiếm
        if (q) {
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchArea = item.area.toLowerCase().includes(q);
          const matchAddress = item.address.toLowerCase().includes(q);
          const matchTags = item.tags.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchArea && !matchAddress && !matchTags) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // Ưu tiên cơ sở đang được chọn lên đầu, sau đó sắp xếp theo khoảng cách tới điểm săn mây đang xem
        if (selectedMapListing?.id === a.id) return -1;
        if (selectedMapListing?.id === b.id) return 1;
        if (activeReferenceSpot) {
          const distA = calculateDistanceKm(a.coordinates, activeReferenceSpot.coordinates);
          const distB = calculateDistanceKm(b.coordinates, activeReferenceSpot.coordinates);
          if (Math.abs(distA - distB) > 0.2) return distA - distB;
        }
        return b.rating - a.rating;
      });
  }, [
    listings,
    activeFilter,
    activeCloudRoute,
    onlyCloudView,
    onlyNearbyRadius,
    activeReferenceSpot,
    searchQuery,
    selectedMapListing
  ]);

  // Tính toán tọa độ hiển thị đã tách chồng đè (Golden-Angle Spiral Offset)
  const displayCoordinatesMap = useMemo(
    () => spreadOverlappingCoordinates(filteredListings, landmarks),
    [filteredListings, landmarks]
  );

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [21.335, 104.484],
      zoom: 13,
      zoomControl: true,
      scrollWheelZoom: true
    });

    const osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const tileLayer = L.tileLayer(osmUrl, {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    cloudRouteLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);

    // Draw main Tà Xùa mountain road backbone (Khe Cải -> Đỉnh Gió -> Trung Tâm -> Thảo Nguyên -> Cây Cô Đơn -> Sống Lưng Khủng Long)
    const mainLoopCoords: [number, number][] = [
      [21.3188, 104.4685], // Khe Cải
      [21.3278, 104.4775], // Đỉnh Gió
      [21.3245, 104.4832], // Trung tâm xã Tà Xùa
      [21.3510, 104.4620], // Thảo Nguyên
      [21.3585, 104.4565], // Cây Cô Đơn
      [21.3245, 104.4832], // Quay lại ngã ba Trung tâm đi Sống Lưng
      [21.3695, 104.5132]  // Sống Lưng Khủng Long
    ];

    L.polyline(mainLoopCoords, {
      color: '#073161',
      weight: 3,
      opacity: 0.55,
      dashArray: '6, 8'
    })
      .bindTooltip('Trục đường đèo săn mây chính Tà Xùa – Háng Đồng – Thảo Nguyên', {
        sticky: true
      })
      .addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Switch Tile Layer URL when mapStyle changes (OSM vs Topo vs Dark)
  useEffect(() => {
    const tileLayer = tileLayerRef.current;
    if (!tileLayer) return;

    if (mapStyle === 'topo') {
      tileLayer.setUrl('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png');
    } else {
      tileLayer.setUrl('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    }
  }, [mapStyle]);

  // Invalidate map size when expanding/collapsing map height
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 220);
    return () => window.clearTimeout(timer);
  }, [isMapExpanded]);

  // Highlight selected Cloud Hunting Route polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    const routeLayer = cloudRouteLayerRef.current;
    if (!map || !routeLayer) return;

    routeLayer.clearLayers();

    if (!activeCloudRoute) return;

    // Outer glow line
    L.polyline(activeCloudRoute.coordinates, {
      color: activeCloudRoute.color,
      weight: 10,
      opacity: 0.25,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(routeLayer);

    // Main route line
    const mainLine = L.polyline(activeCloudRoute.coordinates, {
      color: activeCloudRoute.color,
      weight: 4.5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    })
      .bindTooltip(escapeHtml(`${activeCloudRoute.title} (${activeCloudRoute.distanceLabel})`), {
        sticky: true
      })
      .addTo(routeLayer);

    map.fitBounds(mainLine.getBounds(), {
      padding: [48, 48],
      maxZoom: 14
    });
  }, [activeCloudRoute]);

  // Render Markers & Active Distance Line
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    // 1. Render Cloud Hunting Landmarks
    landmarks.forEach((spot) => {
      const isSelected = selectedLandmark?.id === spot.id && !selectedMapListing;
      const isTargetForListing =
        Boolean(selectedMapListing) && targetCloudSpotId === spot.id;

      const iconHtml = `
        <div style="
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 11px;
          border-radius: 9999px;
          background: ${isSelected ? '#073161' : isTargetForListing ? '#0d7a74' : '#0f172a'};
          border: 2px solid ${
            isSelected
              ? '#f59e0b'
              : spot.cloudProbability >= 85
              ? '#10b981'
              : '#38bdf8'
          };
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
          box-shadow: 0 6px 16px rgba(7,49,97,0.38);
          transform: ${isSelected ? 'scale(1.12)' : 'scale(1)'};
          transition: all 0.2s ease;
        ">
          <span>☁️</span>
          <span>${escapeHtml(spot.area)}</span>
          <span style="
            background: rgba(16, 185, 129, 0.25);
            color: #6ee7b7;
            padding: 1px 6px;
            border-radius: 999px;
            font-size: 10px;
          ">${spot.cloudProbability}%</span>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: iconHtml,
        iconSize: [148, 32],
        iconAnchor: [74, 16]
      });

      const marker = L.marker([spot.coordinates.lat, spot.coordinates.lng], {
        icon: customIcon,
        zIndexOffset: isSelected ? 900 : 600
      });

      marker.bindTooltip(
        buildLandmarkTooltipHtml(spot),
        { direction: 'top', offset: [0, -14] }
      );

      marker.on('click', () => {
        callbacksRef.current.setSelectedMapListing(null);
        callbacksRef.current.setSelectedLandmark(spot);
        map.flyTo([spot.coordinates.lat, spot.coordinates.lng], 14, {
          duration: 0.7
        });
      });

      marker.addTo(markersLayer);
    });

    // 2. Render Filtered Homestays & Services with De-stacked Coordinates
    if (activeFilter !== 'landmarks') {
      filteredListings.forEach((item) => {
        const isSelected = selectedMapListing?.id === item.id;
        const displayCoords =
          displayCoordinatesMap.get(item.id) || item.coordinates;
        const emoji = getCategoryEmoji(item.category);
        const shortPrice =
          item.minPrice > 0 ? `${Math.round(item.minPrice / 1000)}k` : '24/7';
        const shortTitle =
          item.title.length > 14 ? `${item.title.slice(0, 13).trim()}…` : item.title;

        const bgColor =
          item.category === 'homestay'
            ? isSelected
              ? '#073161'
              : '#0d7a74'
            : item.category === 'rescue'
            ? '#e11d48'
            : isSelected
            ? '#073161'
            : '#ffffff';

        const textColor =
          item.category === 'homestay' || item.category === 'rescue' || isSelected
            ? '#ffffff'
            : '#073161';

        const borderColor = isSelected
          ? '#f59e0b'
          : item.hasCloudView
          ? '#0d9488'
          : '#073161';

        const pinHtml = `
          <div style="
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: ${isSelected ? '5px 11px' : '3.5px 8.5px'};
            border-radius: 9999px;
            background: ${bgColor};
            border: 2px solid ${borderColor};
            color: ${textColor};
            font-size: 11px;
            font-weight: 800;
            white-space: nowrap;
            box-shadow: ${
              isSelected
                ? '0 8px 20px rgba(7,49,97,0.42)'
                : '0 3px 10px rgba(7,49,97,0.2)'
            };
            transform: ${isSelected ? 'scale(1.14)' : 'scale(1)'};
            transition: all 0.2s ease;
          ">
            <span>${emoji}</span>
            <span>${escapeHtml(isSelected ? `${shortTitle} · ${shortPrice}` : shortPrice)}</span>
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'custom-map-pin',
          html: pinHtml,
          iconSize: isSelected ? [168, 30] : [74, 26],
          iconAnchor: isSelected ? [84, 15] : [37, 13]
        });

        const marker = L.marker([displayCoords.lat, displayCoords.lng], {
          icon: customIcon,
          zIndexOffset: isSelected ? 1000 : item.hasCloudView ? 320 : 200
        });

        const distToRef = activeReferenceSpot
          ? calculateDistanceKm(item.coordinates, activeReferenceSpot.coordinates)
          : null;

        marker.bindTooltip(
          buildListingTooltipHtml(
            item,
            emoji,
            distToRef !== null && activeReferenceSpot ? { km: distToRef, area: activeReferenceSpot.area } : null
          ),
          { direction: 'top', offset: [0, -12] }
        );

        marker.on('click', () => {
          callbacksRef.current.setSelectedMapListing(item);
          map.flyTo([displayCoords.lat, displayCoords.lng], 15, {
            duration: 0.65
          });
        });

        marker.addTo(markersLayer);
      });
    }

    // 3. Draw Route Line between Selected Listing and Target Cloud Landmark
    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    const activeCloudTarget =
      landmarks.find((l) => l.id === targetCloudSpotId) || landmarks[0];

    if (selectedMapListing && activeCloudTarget) {
      const selectedDisplayCoords =
        displayCoordinatesMap.get(selectedMapListing.id) ||
        selectedMapListing.coordinates;

      const distKm = calculateDistanceKm(
        selectedMapListing.coordinates,
        activeCloudTarget.coordinates
      );
      const mins = estimateMountainTravelMinutes(distKm);

      const poly = L.polyline(
        [
          [selectedDisplayCoords.lat, selectedDisplayCoords.lng],
          [activeCloudTarget.coordinates.lat, activeCloudTarget.coordinates.lng]
        ],
        {
          color: '#0d7a74',
          weight: 3.5,
          dashArray: '5, 7',
          opacity: 0.95
        }
      )
        .bindTooltip(
          escapeHtml(`Khoảng cách tới ${activeCloudTarget.area}: ${distKm} km (~${mins} phút xe máy)`),
          { permanent: false, sticky: true }
        )
        .addTo(map);
      routeLineRef.current = poly;
    }
  }, [
    filteredListings,
    displayCoordinatesMap,
    landmarks,
    activeFilter,
    selectedLandmark,
    selectedMapListing,
    targetCloudSpotId,
    activeReferenceSpot
  ]);

  const handleFlyToLandmark = (spot: CloudLandmark) => {
    setSelectedMapListing(null);
    setSelectedLandmark(spot);
    setTargetCloudSpotId(spot.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([spot.coordinates.lat, spot.coordinates.lng], 14, {
        duration: 0.7
      });
    }
  };

  const handleFlyToListing = (item: Listing) => {
    setSelectedMapListing(item);
    const displayCoords = displayCoordinatesMap.get(item.id) || item.coordinates;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([displayCoords.lat, displayCoords.lng], 15, {
        duration: 0.65
      });
    }
  };

  const handleResetOverview = () => {
    setSelectedMapListing(null);
    setActiveCloudRouteId(null);
    setOnlyNearbyRadius(false);
    setSelectedLandmark(landmarks[0] || null);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([21.338, 104.484], 13, {
        duration: 0.7
      });
    }
  };

  const handleSelectCloudRoute = (route: CloudHuntingRoute) => {
    if (activeCloudRouteId === route.id) {
      setActiveCloudRouteId(null);
      return;
    }
    setActiveCloudRouteId(route.id);
    setSelectedMapListing(null);
  };

  const handleLocateMyGps = () => {
    if (!navigator.geolocation) {
      setGpsStatusMessage('Trình duyệt của bạn không hỗ trợ định vị GPS.');
      return;
    }
    setGpsStatusMessage('Đang xác định tọa độ GPS của bạn...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        const centerTaXua = { lat: 21.3278, lng: 104.4775 };
        const distToTaXua = calculateDistanceKm(userCoords, centerTaXua);

        if (mapInstanceRef.current) {
          if (userLocationMarkerRef.current) {
            userLocationMarkerRef.current.remove();
          }

          const gpsIcon = L.divIcon({
            className: 'custom-map-pin',
            html: `<div style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:999px;background:#2563eb;border:2px solid #ffffff;color:#fff;font-size:11px;font-weight:800;box-shadow:0 4px 14px rgba(37,99,235,0.5);">📍 Vị trí của bạn</div>`,
            iconSize: [118, 28],
            iconAnchor: [59, 14]
          });

          userLocationMarkerRef.current = L.marker([userCoords.lat, userCoords.lng], {
            icon: gpsIcon,
            zIndexOffset: 1200
          }).addTo(mapInstanceRef.current);

          if (distToTaXua <= 35) {
            mapInstanceRef.current.flyTo([userCoords.lat, userCoords.lng], 14, {
              duration: 0.8
            });
            setGpsStatusMessage(
              `Đã định vị! Bạn đang cách Đỉnh Gió Tà Xùa khoảng ${distToTaXua} km.`
            );
          } else {
            setGpsStatusMessage(
              `Bạn đang cách Tà Xùa ~${Math.round(
                distToTaXua
              )} km. Bản đồ vẫn giữ tâm tại Tà Xùa để bạn dễ tra cứu lộ trình.`
            );
          }
        }
      },
      () => {
        setGpsStatusMessage(
          'Không thể lấy GPS (hãy cấp quyền vị trí trên trình duyệt hoặc dùng nút Chỉ đường Google Maps).'
        );
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Thống kê số cơ sở quanh điểm săn mây đang xem (bán kính 3km)
  const nearbyStatsForLandmark = useMemo(() => {
    if (!selectedLandmark) return { homestayCount: 0, cafeFoodCount: 0, totalCount: 0 };
    const nearby = listings.filter(
      (item) =>
        calculateDistanceKm(item.coordinates, selectedLandmark.coordinates) <= 3.2
    );
    return {
      homestayCount: nearby.filter((i) => i.category === 'homestay').length,
      cafeFoodCount: nearby.filter(
        (i) => i.category === 'coffee' || i.category === 'restaurant'
      ).length,
      totalCount: nearby.length
    };
  }, [listings, selectedLandmark]);

  const getGoogleMapsDirectionUrl = (lat: number, lng: number, label?: string) => {
    const query = label ? encodeURIComponent(`${label}, Tà Xùa, Bắc Yên, Sơn La`) : `${lat},${lng}`;
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&query=${query}`;
  };

  return (
    <section
      id="interactive-map-section"
      className="bg-[#f8fafc] border-y border-slate-200/80 py-4 sm:py-6 px-3 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        {/* Compact Above-the-Fold Header + Quick Landmark Jump Pills */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-[11px] font-extrabold uppercase tracking-wider text-teal-800">
              <Compass className="w-3.5 h-3.5 text-teal-600" />
              <span>Bản Đồ Số Tà Xùa</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#073161] tracking-tight">
              Định Vị Homestay, Tọa Độ Săn Mây & Tuyến Đèo Thực Địa
            </h2>
            <span className="text-xs text-slate-500 font-semibold hidden xl:inline">
              ({landmarks.length} tọa độ săn mây · {filteredListings.length} cơ sở đã tách ghim)
            </span>
          </div>

          {/* Quick Jump Buttons (Horizontally Scrollable) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={handleResetOverview}
              className="px-3 py-1.5 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-[#073161] transition-colors flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
            >
              <Navigation className="w-3.5 h-3.5 text-teal-700" />
              <span>Toàn cảnh</span>
            </button>

            {landmarks.map((spot) => (
              <button
                key={spot.id}
                type="button"
                onClick={() => handleFlyToLandmark(spot)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 shrink-0 border cursor-pointer ${
                  selectedLandmark?.id === spot.id && !selectedMapListing
                    ? 'bg-[#073161] text-white border-[#073161] shadow-2xs'
                    : 'bg-white hover:bg-slate-50 text-[#073161] border-slate-200'
                }`}
              >
                <CloudSun
                  className={`w-3.5 h-3.5 ${
                    selectedLandmark?.id === spot.id && !selectedMapListing
                      ? 'text-emerald-300'
                      : 'text-teal-600'
                  }`}
                />
                <span>
                  {spot.area} ({spot.cloudProbability}%)
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Unified Sleek Map Command Bar (Routes + Search + Filters + Controls) */}
        <div className="bg-white border border-slate-200/90 p-2.5 sm:p-3 rounded-2xl mb-3.5 shadow-2xs space-y-2.5">
          {/* Row 1: Search + 3 Cloud Routes + GPS & View Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
            {/* Search Input on Map */}
            <div className="relative w-full lg:w-72 shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && filteredListings.length > 0) {
                    handleFlyToListing(filteredListings[0]);
                  }
                }}
                placeholder="Tìm Homestay, Cafe (Mị Ơi, Lu Trế...)"
                className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#073161] focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 3 Cloud Hunting Routes Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1">
              <span className="text-[11px] font-extrabold text-[#073161] shrink-0 hidden md:inline flex items-center gap-1">
                <Route className="w-3.5 h-3.5 text-teal-700" />
                <span>Cung săn mây:</span>
              </span>
              {CLOUD_HUNTING_ROUTES.map((route) => {
                const isActive = activeCloudRouteId === route.id;
                return (
                  <button
                    key={route.id}
                    type="button"
                    onClick={() => handleSelectCloudRoute(route)}
                    className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[#073161] text-white border-[#073161] shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>{route.shortName.split(':')[0]}</span>
                    <span
                      className={`text-[10px] ${
                        isActive ? 'text-teal-200' : 'text-slate-500 font-normal'
                      }`}
                    >
                      ({route.distanceLabel})
                    </span>
                  </button>
                );
              })}
              {activeCloudRoute && (
                <button
                  type="button"
                  onClick={() => setActiveCloudRouteId(null)}
                  className="text-[11px] font-bold text-slate-400 hover:text-rose-600 px-1.5 cursor-pointer shrink-0"
                >
                  ✕ Bỏ cung
                </button>
              )}
            </div>

            {/* Map Actions: GPS & Expand */}
            <div className="flex items-center gap-1.5 shrink-0 self-end lg:self-center">
              <button
                type="button"
                onClick={handleLocateMyGps}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 transition-all flex items-center gap-1 cursor-pointer"
                title="Định vị vị trí GPS hiện tại"
              >
                <Navigation className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Vị trí của tôi</span>
              </button>

              <button
                type="button"
                onClick={() => setIsMapExpanded((prev) => !prev)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all flex items-center gap-1 cursor-pointer"
                title="Mở rộng / Thu gọn khung bản đồ"
              >
                {isMapExpanded ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Thu gọn</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Mở rộng</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Active Route Advice Alert (if any) */}
          {activeCloudRoute && (
            <div className="px-3 py-1.5 rounded-xl bg-teal-50/80 border border-teal-200/90 text-xs text-teal-950 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: activeCloudRoute.color }}
                />
                <strong className="text-[#073161] shrink-0">{activeCloudRoute.title}:</strong>
                <span className="truncate text-slate-700">{activeCloudRoute.advice}</span>
              </div>
              <span className="font-bold text-[11px] text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded-md shrink-0">
                {activeCloudRoute.difficultyLabel}
              </span>
            </div>
          )}

          {gpsStatusMessage && (
            <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-blue-50/90 border border-blue-200 text-xs text-blue-900">
              <span>📍 {gpsStatusMessage}</span>
              <button
                type="button"
                onClick={() => setGpsStatusMessage(null)}
                className="text-blue-700 hover:text-blue-950 font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          )}

          {/* Row 2: Category Tabs + Quick Chips + Map Mode */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
            {/* Category Filter Pills (Scrollable) */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-[#073161] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Tất cả ({landmarks.length + listings.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('landmarks')}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeFilter === 'landmarks'
                    ? 'bg-[#073161] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                ☁️ Điểm Săn Mây ({landmarks.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('homestay')}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeFilter === 'homestay'
                    ? 'bg-[#073161] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                🏡 Homestay ({listings.filter((l) => l.category === 'homestay').length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('coffee_food')}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeFilter === 'coffee_food'
                    ? 'bg-[#073161] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                ☕ Cafe & Ăn ({listings.filter((l) => l.category === 'coffee' || l.category === 'restaurant').length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('transport')}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeFilter === 'transport'
                    ? 'bg-[#073161] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                🛵 Xe máy & Nhà xe ({listings.filter((l) => l.category === 'motorbike' || l.category === 'taxi' || l.category === 'bus').length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('tour_photo')}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeFilter === 'tour_photo'
                    ? 'bg-[#073161] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                🥾 Tour & Ảnh ({listings.filter((l) => l.category === 'tour' || l.category === 'photo' || l.category === 'costume' || l.category === 'camera').length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('rescue')}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeFilter === 'rescue'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                🚨 Cứu hộ ({listings.filter((l) => l.category === 'rescue').length})
              </button>
            </div>

            {/* Right: Quick Chips & Map Style Mode */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setOnlyCloudView((prev) => !prev)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                  onlyCloudView
                    ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>View Mây</span>
              </button>

              <button
                type="button"
                onClick={() => setOnlyNearbyRadius((prev) => !prev)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                  onlyNearbyRadius
                    ? 'bg-[#073161] text-white border-[#073161] shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>&lt; 3km quanh {activeReferenceSpot?.area || 'Đỉnh Gió'}</span>
              </button>

              {/* Map Layer Mode */}
              <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-full border border-slate-200">
                <button
                  type="button"
                  onClick={() => setMapStyle('osm')}
                  className={`px-2 py-0.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    mapStyle === 'osm'
                      ? 'bg-[#073161] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Chuẩn
                </button>
                <button
                  type="button"
                  onClick={() => setMapStyle('topo')}
                  className={`px-2 py-0.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    mapStyle === 'topo'
                      ? 'bg-[#073161] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ⛰️ Địa hình
                </button>
                <button
                  type="button"
                  onClick={() => setMapStyle('dark')}
                  className={`px-2 py-0.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    mapStyle === 'dark'
                      ? 'bg-[#073161] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🌙 Đêm
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Main Interactive Map & Synced Inspector Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Map Canvas Column */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div
              className={`relative rounded-3xl overflow-hidden border border-slate-200 shadow-lg bg-slate-100 transition-all duration-300 ${
                isMapExpanded ? 'h-[740px] sm:h-[820px]' : 'h-[580px] sm:h-[660px] lg:h-[700px]'
              }`}
            >
              <div
                ref={mapContainerRef}
                data-testid="taxua-interactive-map"
                className={`w-full h-full z-10 ${mapStyle === 'dark' ? 'map-theme-dark' : ''}`}
              />

              {/* Top-Right Active Status Pill on Map */}
              <div className="absolute top-3.5 right-3.5 z-20 bg-white/95 backdrop-blur-md border border-slate-200 rounded-full px-3.5 py-1.5 text-[11px] font-bold text-[#073161] shadow-md flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  Đang hiển thị:{' '}
                  <strong>
                    {activeFilter === 'landmarks'
                      ? `${landmarks.length} tọa độ săn mây`
                      : `${filteredListings.length} cơ sở & ${landmarks.length} điểm săn mây`}
                  </strong>
                </span>
              </div>

              {/* Floating Map Legend */}
              <div className="absolute bottom-3.5 left-3.5 z-20 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-3 text-[11px] text-slate-700 shadow-lg pointer-events-none space-y-1 max-w-xs">
                <div className="font-extrabold text-[#073161] mb-1">
                  Chú giải bản đồ Tà Xùa (Đã tách chồng ghim):
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>☁️ Tọa độ săn mây chính + Tỷ lệ Cloud View</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-teal-700 shrink-0" />
                  <span>🏡 Homestay · ☕ Cafe · 🛵 Dịch vụ (Rê chuột xem tên)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-4 border-b-2 border-dashed border-[#0d7a74] shrink-0" />
                  <span>Đường nối đo khoảng cách tới điểm săn mây</span>
                </div>
              </div>
            </div>

            {/* Horizontal Quick Directory of 5 Cloud Hunting Landmarks */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {landmarks.map((spot) => {
                const isSelected = selectedLandmark?.id === spot.id && !selectedMapListing;
                const isTarget =
                  Boolean(selectedMapListing) && targetCloudSpotId === spot.id;
                return (
                  <button
                    key={spot.id}
                    type="button"
                    onClick={() => handleFlyToLandmark(spot)}
                    className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#073161] text-white border-[#073161] shadow-md'
                        : isTarget
                        ? 'bg-teal-50 border-teal-500 text-slate-900'
                        : 'bg-white border-slate-200 hover:border-[#073161]/40 text-slate-800'
                    }`}
                  >
                    <div
                      className={`flex items-center justify-between text-[11px] font-bold mb-1 ${
                        isSelected ? 'text-teal-200' : 'text-teal-700'
                      }`}
                    >
                      <span>⛰️ {spot.altitude}</span>
                      <span>☁️ {spot.cloudProbability}%</span>
                    </div>
                    <div
                      className={`text-xs font-extrabold line-clamp-1 ${
                        isSelected ? 'text-white' : 'text-[#073161]'
                      }`}
                    >
                      {spot.area}
                    </div>
                    <div
                      className={`text-[11px] line-clamp-1 mt-0.5 ${
                        isSelected ? 'text-slate-200' : 'text-slate-500'
                      }`}
                    >
                      {spot.distanceFromCenter}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Inspector & Synced Directory Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-4 pb-16 lg:pb-6">
            {selectedMapListing ? (
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-md flex flex-col">
                <div className="relative h-44 w-full">
                  <img
                    src={selectedMapListing.coverImage}
                    alt={selectedMapListing.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#073161] text-white">
                        📍 {selectedMapListing.area}
                      </span>
                      {selectedMapListing.hasCloudView && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-600 text-white">
                          ☁️ View Biển Mây
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedMapListing(null)}
                      className="w-7 h-7 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center text-xs cursor-pointer"
                      title="Đóng cơ sở, quay lại xem Điểm Săn Mây"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
                    <div className="text-[11px] text-teal-200 font-bold mb-0.5">
                      {getCategoryEmoji(selectedMapListing.category)}{' '}
                      {getCategoryLabel(selectedMapListing.category)} · ⭐{' '}
                      {selectedMapListing.rating} ({selectedMapListing.reviewCount} đánh giá)
                    </div>
                    <h3 className="text-base font-extrabold line-clamp-1">
                      {selectedMapListing.title}
                    </h3>
                    <p className="text-xs text-slate-200 line-clamp-1">
                      {selectedMapListing.address}
                    </p>
                  </div>
                </div>

                <div className="p-4 sm:p-5 space-y-3.5">
                  {/* Distance Matrix to All Cloud Landmarks */}
                  <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs font-extrabold text-[#073161]">
                      <span className="flex items-center gap-1.5">
                        <Route className="w-4 h-4 text-teal-700" />
                        <span>Khoảng cách tới 5 tọa độ săn mây:</span>
                      </span>
                      <span className="text-[10px] font-normal text-slate-500">
                        Bấm để vẽ đường nối
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 pt-0.5 text-xs">
                      {landmarks.map((lm) => {
                        const distKm = calculateDistanceKm(
                          selectedMapListing.coordinates,
                          lm.coordinates
                        );
                        const mins = estimateMountainTravelMinutes(distKm);
                        const isTarget = targetCloudSpotId === lm.id;
                        return (
                          <button
                            key={lm.id}
                            type="button"
                            onClick={() => setTargetCloudSpotId(lm.id)}
                            className={`text-left p-2 rounded-xl border cursor-pointer transition-all ${
                              isTarget
                                ? 'bg-[#073161] border-[#073161] text-white shadow-2xs'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <div
                              className={`text-[10px] font-bold truncate ${
                                isTarget ? 'text-teal-200' : 'text-slate-500'
                              }`}
                            >
                              ☁️ {lm.area}
                            </div>
                            <div className="font-extrabold text-xs sm:text-sm tabular-nums mt-0.5">
                              {distKm} km{' '}
                              <span
                                className={`text-[10px] font-semibold ${
                                  isTarget ? 'text-slate-200' : 'text-teal-700'
                                }`}
                              >
                                (~{mins}p)
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Price & Public Phone */}
                  <div className="flex items-center justify-between text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-500 block text-[10px]">
                        Giá niêm yết tham khảo:
                      </span>
                      <span className="text-sm font-extrabold text-[#073161] tabular-nums">
                        {selectedMapListing.minPrice > 0
                          ? formatVND(selectedMapListing.minPrice)
                          : 'Hỗ trợ 24/7'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={getGoogleMapsDirectionUrl(
                          selectedMapListing.coordinates.lat,
                          selectedMapListing.coordinates.lng,
                          selectedMapListing.title
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold px-2.5 py-1.5 rounded-full border border-teal-200"
                        title="Mở chỉ đường Google Maps"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Chỉ đường</span>
                      </a>
                      <a
                        href={`tel:${selectedMapListing.phone.replace(/\s+/g, '')}`}
                        className="flex items-center gap-1 bg-white hover:bg-slate-100 text-[#073161] font-bold px-2.5 py-1.5 rounded-full border border-slate-200"
                      >
                        <Phone className="w-3.5 h-3.5 text-teal-700" />
                        <span>Gọi</span>
                      </a>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectListing(selectedMapListing)}
                    className="w-full bg-[#073161] hover:bg-[#0a3f7c] text-white font-bold py-3 rounded-full text-xs shadow-sm transition-all cursor-pointer"
                  >
                    Xem hồ sơ chi tiết & Đặt dịch vụ →
                  </button>
                </div>
              </div>
            ) : selectedLandmark ? (
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-md flex flex-col">
                <div className="relative h-44 w-full">
                  <img
                    src={selectedLandmark.imageUrl}
                    alt={selectedLandmark.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#073161] text-white">
                      ⛰️ Độ cao {selectedLandmark.altitude}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-700 text-white">
                      ☁️ {selectedLandmark.cloudProbability}% Cloud View
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
                    <h3 className="text-base font-extrabold">{selectedLandmark.name}</h3>
                    <p className="text-xs text-teal-200 font-medium">
                      {selectedLandmark.distanceFromCenter}
                    </p>
                  </div>
                </div>

                <div className="p-4 sm:p-5 space-y-3 text-xs">
                  <p className="text-slate-600 leading-relaxed">
                    {selectedLandmark.description}
                  </p>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Khung giờ vàng săn mây:</span>
                      <span className="text-[#073161] font-bold">
                        {selectedLandmark.bestTime}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Tọa độ GPS:</span>
                      <span className="font-mono text-slate-700 tabular-nums">
                        {selectedLandmark.coordinates.lat.toFixed(4)}°N,{' '}
                        {selectedLandmark.coordinates.lng.toFixed(4)}°E
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/70">
                      <span className="text-slate-500">Dịch vụ bán kính 3km:</span>
                      <span className="font-bold text-teal-800">
                        🏡 {nearbyStatsForLandmark.homestayCount} Homestay · ☕{' '}
                        {nearbyStatsForLandmark.cafeFoodCount} Quán
                      </span>
                    </div>
                  </div>

                  <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-3 text-slate-700">
                    <strong className="text-[#073161] block mb-0.5">
                      Đường vào đã thẩm định thực tế:
                    </strong>
                    {selectedLandmark.roadCondition}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setOnlyNearbyRadius((prev) => !prev)}
                      className={`py-2.5 px-3 rounded-xl font-bold text-xs border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        onlyNearbyRadius
                          ? 'bg-[#073161] text-white border-[#073161]'
                          : 'bg-slate-100 hover:bg-slate-200 text-[#073161] border-slate-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>
                        {onlyNearbyRadius ? 'Đang lọc < 3km' : `Lọc quanh ${selectedLandmark.area}`}
                      </span>
                    </button>

                    <a
                      href={getGoogleMapsDirectionUrl(
                        selectedLandmark.coordinates.lat,
                        selectedLandmark.coordinates.lng,
                        selectedLandmark.name
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 rounded-xl font-bold text-xs bg-teal-700 hover:bg-teal-800 text-white transition-all flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Chỉ đường Google Maps</span>
                    </a>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Synced Directory List of Filtered Listings on Map */}
            <div className="bg-white border border-slate-200 rounded-3xl p-4 flex-1 shadow-2xs">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#073161]">
                    Cơ sở đang hiển thị ({filteredListings.length})
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Sắp xếp theo khoảng cách tới{' '}
                    <strong className="text-teal-700">
                      {activeReferenceSpot?.area || 'Đỉnh Gió'}
                    </strong>
                  </p>
                </div>

                {(searchQuery ||
                  activeFilter !== 'all' ||
                  onlyCloudView ||
                  onlyNearbyRadius ||
                  activeCloudRouteId) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setActiveFilter('all');
                      setOnlyCloudView(false);
                      setOnlyNearbyRadius(false);
                      setActiveCloudRouteId(null);
                    }}
                    className="text-[11px] font-bold text-teal-700 hover:text-teal-900 underline cursor-pointer shrink-0"
                  >
                    Đặt lại lọc
                  </button>
                )}
              </div>

              {filteredListings.length === 0 ? (
                <div className="text-center py-8 px-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-xs font-bold text-slate-700">
                    Không tìm thấy cơ sở phù hợp với bộ lọc hiện tại.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setActiveFilter('all');
                      setOnlyCloudView(false);
                      setOnlyNearbyRadius(false);
                      setActiveCloudRouteId(null);
                    }}
                    className="mt-2.5 px-3.5 py-1.5 rounded-full bg-[#073161] text-white text-xs font-bold cursor-pointer"
                  >
                    Hiển thị lại toàn bộ 190 vị trí
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[480px] lg:max-h-[580px] overflow-y-auto pr-1">
                  {filteredListings.map((item) => {
                    const isCurrent = selectedMapListing?.id === item.id;
                    const distKm = activeReferenceSpot
                      ? calculateDistanceKm(
                          item.coordinates,
                          activeReferenceSpot.coordinates
                        )
                      : 0;
                    const travelMins = estimateMountainTravelMinutes(distKm);

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleFlyToListing(item)}
                        className={`w-full text-left p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                          isCurrent
                            ? 'bg-[#073161] border-[#073161] text-white shadow-sm'
                            : 'bg-slate-50/90 border-slate-200/80 hover:border-[#073161]/40 hover:bg-white text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-base shrink-0">
                            {getCategoryEmoji(item.category)}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-xs font-extrabold truncate ${
                                  isCurrent ? 'text-white' : 'text-[#073161]'
                                }`}
                              >
                                {item.title}
                              </span>
                              {item.hasCloudView && (
                                <span
                                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                                    isCurrent
                                      ? 'bg-teal-500/30 text-teal-200'
                                      : 'bg-teal-50 text-teal-700 border border-teal-200'
                                  }`}
                                >
                                  ☁️ Mây
                                </span>
                              )}
                            </div>
                            <div
                              className={`text-[10px] flex items-center gap-1.5 mt-0.5 ${
                                isCurrent ? 'text-slate-200' : 'text-slate-500'
                              }`}
                            >
                              <span>{item.area}</span>
                              <span>·</span>
                              <span>⭐ {item.rating}</span>
                              <span>·</span>
                              <span
                                className={
                                  isCurrent
                                    ? 'text-teal-200 font-bold'
                                    : 'text-teal-700 font-semibold'
                                }
                              >
                                Cách {distKm}km (~{travelMins}p)
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end shrink-0 gap-1">
                          <span
                            className={`text-xs font-extrabold tabular-nums ${
                              isCurrent ? 'text-amber-300' : 'text-[#073161]'
                            }`}
                          >
                            {item.minPrice > 0
                              ? `${Math.round(item.minPrice / 1000)}k`
                              : '24/7'}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectListing(item);
                            }}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                              isCurrent
                                ? 'bg-white text-[#073161] hover:bg-slate-100'
                                : 'bg-white text-teal-700 border border-slate-200 hover:border-teal-600'
                            }`}
                          >
                            Mở hồ sơ
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
