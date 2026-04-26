// src/components/parking/ParkingSpaceList.tsx
import React, { useEffect, useState } from 'react';
import { ParkingSpace } from '../../types/parking';
import {
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaMapMarkerAlt,
  FaClock,
  FaShieldAlt,
  FaBolt,
  FaWheelchair,
  FaVideo,
  FaUmbrella,
  FaCar,
  FaSearch,
  FaRoad,
} from 'react-icons/fa';
import axios from 'axios';

interface ParkingSpaceListProps {
  spaces: ParkingSpace[];
  onSpaceSelect: (space: ParkingSpace) => void;
  searchRadius?: number;
  onRadiusChange?: (radius: number) => void;
  userLocation: { lat: number; lng: number };
  filters: {
    amenities: { [key: string]: boolean };
    priceRange: [number, number];
  };
  startTime?: string | null;
  endTime?: string | null;
}

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const toRadians = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getAmenityIcon = (amenity: string) => {
  const amenityLower = amenity.toLowerCase();
  const amenityIcons: { [key: string]: React.ElementType } = {
    security: FaShieldAlt,
    cctv: FaVideo,
    surveillance: FaVideo,
    camera: FaVideo,
    charging: FaBolt,
    electric: FaBolt,
    wheelchair: FaWheelchair,
    accessible: FaWheelchair,
    covered: FaUmbrella,
    roof: FaUmbrella,
    indoor: FaUmbrella,
    '24/7': FaClock,
  };

  for (const [key, icon] of Object.entries(amenityIcons)) {
    if (amenityLower.includes(key)) return icon;
  }
  return FaCar;
};

const formatINR = (value: number, showCents = false) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: showCents ? 2 : 0,
  }).format(value);

const computePriceMeta = (space: any) => {
  const baseRaw = space?.priceParking ?? space?.price ?? 0;
  const base = Number(baseRaw) || 0;
  let rawDiscount = space?.discount ?? space?.discountPercent ?? space?.discount_percentage ?? 0;
  if (typeof rawDiscount === 'string') rawDiscount = rawDiscount.replace('%', '');
  if (typeof rawDiscount === 'object' && rawDiscount !== null) rawDiscount = rawDiscount.percent ?? rawDiscount.value ?? rawDiscount.amount ?? 0;
  const discountNum = Number(rawDiscount);
  const discountPercent = Number.isFinite(discountNum) ? Math.max(0, Math.min(100, discountNum)) : 0;
  const discountedPrice = +(base * (1 - discountPercent / 100)).toFixed(2);
  const hasDiscount = discountPercent > 0 && discountedPrice < base;
  return { basePrice: +base.toFixed(2), discountPercent, discountedPrice, hasDiscount };
};

function computeDurationHours(start?: string | null, end?: string | null): number | null {
  if (!start || !end) return null;
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) return null;
  return (e.getTime() - s.getTime()) / (1000 * 60 * 60);
}

function formatDurationReadable(hours: number) {
  if (!Number.isFinite(hours) || hours <= 0) return '';
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

const renderStars = (value: number, sizeClass = 'text-[8px]') => {
  const safe = Number.isFinite(value) ? value : 0;
  const rounded = Math.round(safe * 2) / 2;
  const full = Math.floor(rounded);
  const hasHalf = rounded - full >= 0.5;
  const empty = 5 - full - (hasHalf ? 1 : 0);
  const nodes: React.ReactNode[] = [];
  for (let i = 0; i < full; i++) nodes.push(<FaStar key={`f-${i}`} className={`${sizeClass} text-yellow-400 mr-0.5`} />);
  if (hasHalf) nodes.push(<FaStarHalfAlt key="half" className={`${sizeClass} text-yellow-400 mr-0.5`} />);
  for (let i = 0; i < empty; i++) nodes.push(<FaRegStar key={`e-${i}`} className={`${sizeClass} text-gray-300 mr-0.5`} />);
  return <div className="flex items-center">{nodes}</div>;
};

export default function ParkingSpaceList({
  spaces,
  onSpaceSelect,
  searchRadius,
  userLocation,
  filters,
  startTime,
  endTime,
}: ParkingSpaceListProps) {
  const [ratingsMap, setRatingsMap] = useState<Record<string, { avg: number; count: number }>>({});

  useEffect(() => {
    if (!Array.isArray(spaces) || spaces.length === 0) {
      setRatingsMap({});
      return;
    }

    let mounted = true;
    const token = localStorage.getItem('token') || '';
    const base = import.meta.env.VITE_BASE_URL || '';

    const idOf = (s: any) => {
      if (!s) return null;
      if (s._id && typeof s._id === 'object' && s._id.toString) return s._id.toString();
      if (s._id) return String(s._id);
      if (s.id && typeof s.id === 'object' && s.id.toString) return s.id.toString();
      if (s.id) return String(s.id);
      return null;
    };

    const ids = spaces.map((s: any) => idOf(s)).filter(Boolean) as string[];

    const fetchRatingFor = async (id: string) => {
      try {
        const r = await axios.get(`${base}/api/ratings/parking/${id}`, {
          headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
        });
        const data = r?.data ?? {};
        if (data?.stats && (typeof data.stats.avg === 'number' || typeof data.stats.count === 'number')) {
          return { id, avg: Number(data.stats.avg) || 0, count: Number(data.stats.count) || 0 };
        }
        const directAvgCandidates = [
          data?.avg,
          data?.average,
          data?.avgScore,
          data?.averageScore,
          data?.mean,
          data?.rating,
          data?.average_rating,
        ];
        const foundDirectAvg = directAvgCandidates.find((v) => typeof v === 'number');
        if (typeof foundDirectAvg === 'number') {
          const count = typeof data.count === 'number' ? data.count : typeof data?.ratings?.length === 'number' ? data.ratings.length : 0;
          return { id, avg: Number(foundDirectAvg), count };
        }
        const ratingsArray: any[] = Array.isArray(data) ? data : Array.isArray(data?.ratings) ? data.ratings : [];
        if (ratingsArray.length > 0) {
          const sum = ratingsArray.reduce((s, it) => s + (Number(it.score) || 0), 0);
          const avg = sum / ratingsArray.length;
          return { id, avg, count: ratingsArray.length };
        }
        if (Array.isArray(data?.diagnostics?.sampleDocs) && data.diagnostics.sampleDocs.length > 0) {
          const sample = data.diagnostics.sampleDocs.filter((d: any) => String(d.parkingSpace) === id);
          if (sample.length > 0) {
            const sum = sample.reduce((s: number, it: any) => s + (Number(it.score) || 0), 0);
            return { id, avg: sum / sample.length, count: sample.length };
          }
        }
        try {
          const p = await axios.get(`${base}/api/parking/${id}`, {
            headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
          });
          const pd = p?.data ?? {};
          if (typeof pd.rating === 'number' || typeof pd.avg === 'number' || typeof pd.avgRating === 'number') {
            const avg = pd.rating ?? pd.avg ?? pd.avgRating ?? 0;
            const count = pd.ratingCount ?? pd.ratingsCount ?? 0;
            return { id, avg: Number(avg) || 0, count: Number(count) || 0 };
          }
        } catch (e) {}
        return { id, avg: 0, count: 0 };
      } catch (err) {
        console.error(`rating fetch failed for ${id}`, err?.response?.data ?? err.message ?? err);
        return { id, avg: 0, count: 0 };
      }
    };

    (async () => {
      const results = await Promise.all(ids.map((id) => fetchRatingFor(id)));
      if (!mounted) return;
      const map: Record<string, { avg: number; count: number }> = {};
      results.forEach((r) => {
        if (r && r.id) map[r.id] = { avg: r.avg, count: r.count };
      });
      spaces.forEach((s: any) => {
        const id = idOf(s);
        if (!id) return;
        if (map[id]) return;
        const preAvg =
          typeof s.rating === 'number'
            ? s.rating
            : typeof s.avg === 'number'
            ? s.avg
            : typeof s.avgRating === 'number'
            ? s.avgRating
            : 0;
        const preCount = typeof s.ratingCount === 'number' ? s.ratingCount : typeof s.count === 'number' ? s.count : 0;
        map[id] = { avg: preAvg, count: preCount };
      });
      if (mounted) setRatingsMap(map);
    })();

    return () => {
      mounted = false;
    };
  }, [spaces]);

  const filteredSpaces = spaces.filter((space: any) => {
    const coords = space?.location?.coordinates ?? [0, 0];
    const distance = calculateDistance(userLocation.lat, userLocation.lng, coords[1] ?? 0, coords[0] ?? 0);
    (space as any).distance = distance;
    for (const [key, value] of Object.entries(filters.amenities)) {
      if (value && !space.amenities?.some((amenity: string) => amenity?.toLowerCase?.().includes(key.toLowerCase()))) {
        return false;
      }
    }
    const price = Number(space.priceParking ?? space.price ?? 0);
    if (price < filters.priceRange[0] || price > filters.priceRange[1]) return false;
    return true;
  });

  if (filteredSpaces.length === 0) {
    return (
      <div className="py-list-root flex flex-col items-center justify-center p-4 text-center h-32 rounded-xl">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2 shadow-lg">
          <FaSearch className="text-lg" />
        </div>
        <h3 className="text-sm font-bold mb-1">No parking spaces found</h3>
        <p className="text-xs mb-2 max-w-xs">Try adjusting your filters or search radius</p>
        <style jsx>{`
          .py-list-root { --bg: #f8fafc; --card: #ffffff; --muted: #6b7280; --accent-from:#3b82f6; --accent-to:#8b5cf6; }
          .dark .py-list-root { --bg: #0b1220; --card: #0f1724; --muted: #9fb0c8; --accent-from:#5b8dff; --accent-to:#9a7bff; }
          .py-list-root { background: transparent; color: var(--muted); }
          .py-list-root .w-12 { background: linear-gradient(135deg,var(--accent-from),var(--accent-to)); color: white; }
        `}</style>
      </div>
    );
  }

  const durationHours = computeDurationHours(startTime, endTime);
  const timeFilterActive = Boolean(startTime && endTime);

  return (
    <div className="py-list-root space-y-1 max-h-64 overflow-y-auto pr-1">
      {filteredSpaces.map((space: any) => {
        const address: any = space.address || {};
        const amenities = Array.isArray(space.amenities) ? space.amenities : [];
        const id =
          space?._id && typeof space._id === 'object' && space._id.toString ? space._id.toString() : String(space._id ?? '');
        const mapped = ratingsMap[id];
        const ratingVal = mapped?.avg ?? (typeof space.rating === 'number' ? space.rating : typeof space.avg === 'number' ? space.avg : 0);
        const ratingCount = mapped?.count ?? (typeof space.ratingCount === 'number' ? space.ratingCount : 0);
        const timeWindowAvail = typeof space.availableSpots === 'number' ? space.availableSpots : undefined;
        const totalCapacity = Number(space.totalSpots ?? space.total_slots ?? space.capacity ?? 0) || 0;
        const shownAvailability = timeFilterActive ? (timeWindowAvail ?? 0) : totalCapacity;
        const priceMeta = (space as any).__price ?? computePriceMeta(space);
        const basePrice = priceMeta.basePrice;
        const discountedPrice = priceMeta.discountedPrice;
        const hasDiscount = priceMeta.hasDiscount;
        const discountPercent = priceMeta.discountPercent;
        const perHour = hasDiscount ? discountedPrice : basePrice;
        const totalAmount = durationHours ? +(perHour * durationHours).toFixed(2) : null;
        const durationReadable = durationHours ? formatDurationReadable(durationHours) : null;
        const key = id || `${Math.random()}`;

        return (
          <div
            key={key}
            onClick={() => onSpaceSelect(space)}
            className="group bg-white/90 dark:bg-[#0f1724] rounded-lg shadow-sm hover:shadow-md cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 border border-white/30 dark:border-transparent overflow-hidden hover:border-blue-300 relative"
          >
            <div className="p-1.5">
              <div className="flex justify-between items-start mb-1">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-white text-[10px] leading-tight truncate mb-0.5">
                    {space.title || 'Premium Parking Space'}
                  </h3>
                  <div className="flex items-center text-gray-600 dark:text-[#9fb0c8] text-[9px]">
                    <FaMapMarkerAlt className="text-red-500 mr-0.5 flex-shrink-0" />
                    <span className="truncate">
                      {address.street || 'Unknown Street'}, {address.city || 'Unknown City'}
                    </span>
                  </div>
                </div>

                <div className="text-right ml-1 flex-shrink-0">
                  {hasDiscount ? (
                    <div className="flex flex-col items-end">
                      <div className="text-[9px] text-gray-400 line-through">{formatINR(basePrice, false)}</div>
                      <div className="text-sm font-bold text-green-700 dark:text-green-300">{formatINR(discountedPrice, true)}</div>
                      <div className="text-[7px] mt-0.5 inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-1 py-0.5 rounded font-semibold">
                        {discountPercent}% OFF
                      </div>
                      <div className="text-[9px] text-gray-500 mt-0.5">/hr</div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-1 py-0.5 rounded text-[10px] font-bold">
                      {formatINR(basePrice, false)}
                      <span className="text-[8px] ml-0.5">/hr</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end mt-0.5">
                    {ratingVal > 0 ? (
                      <div className="flex items-center">
                        <div className="mr-1">{renderStars(ratingVal, 'text-[8px]')}</div>
                        <div className="text-[9px] font-semibold text-gray-700 dark:text-[#dbe7f7]">{Number(ratingVal).toFixed(1)}</div>
                        {ratingCount ? <div className="text-[8px] text-gray-400 ml-0.5">({ratingCount})</div> : null}
                      </div>
                    ) : (
                      <div className="text-[9px] text-gray-400">No ratings</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center text-[9px] text-gray-600 dark:text-[#9fb0c8] bg-blue-50 dark:bg-[#0b1220] px-1 py-0.5 rounded-full">
                  <FaRoad className="text-blue-500 mr-0.5" />
                  <span>{(space.distance as number)?.toFixed(1)} km away</span>
                </div>

                <div
                  className={`flex items-center text-[9px] px-1 py-0.5 rounded-full font-semibold ${
                    timeFilterActive ? 'text-green-600 bg-green-50 dark:bg-transparent' : 'text-gray-600 bg-gray-100 dark:bg-[#0b1220]'
                  }`}
                >
                  {shownAvailability} spot{shownAvailability !== 1 ? 's' : ''} {timeFilterActive ? 'available' : 'total'}
                </div>
              </div>

              {amenities.length > 0 && (
                <div className="mb-1">
                  <div className="flex flex-wrap gap-0.5">
                    {amenities.slice(0, 2).map((amenity: string, idx: number) => {
                      const AmenityIcon = getAmenityIcon(amenity);
                      return (
                        <span
                          key={idx}
                          className="inline-flex items-center px-1 py-0.5 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-full text-[9px] font-medium border border-blue-200 dark:bg-transparent dark:border-[#1f2a38] dark:text-[#9fb0c8]"
                          title={amenity}
                        >
                          <AmenityIcon className="mr-0.5 text-[9px]" />
                          {amenity.length > 10 ? amenity.substring(0, 8) + '...' : amenity}
                        </span>
                      );
                    })}
                    {amenities.length > 2 && (
                      <span className="inline-flex items-center px-1 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[9px] font-medium dark:bg-transparent dark:border-[#1f2a38] dark:text-[#9fb0c8]">
                        +{amenities.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="mb-1">
                {durationHours && totalAmount ? (
                  <div className="flex items-center justify-between">
                    <div className="text-[9px] text-gray-600 dark:text-[#9fb0c8]">Total for {durationReadable}</div>
                    <div className="font-semibold text-gray-900 dark:text-white text-[10px]">{formatINR(totalAmount, true)}</div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="text-[9px] text-gray-600 dark:text-[#9fb0c8]">Rate</div>
                    <div className="font-semibold text-gray-900 dark:text-white text-[11px]">{formatINR(perHour, false)}/hr</div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-[#15202b]">
                <div className="flex items-center text-[9px] text-gray-500 dark:text-[#9fb0c8]">
                  <span className="flex items-center bg-gray-100 px-1 py-0.5 rounded-full dark:bg-[#07101a]">
                    <FaClock className="mr-0.5 text-blue-500 text-[9px]" />
                    {space.available24_7 ? '24/7' : 'Limited'}
                  </span>
                </div>

                <button
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-2 py-0.5 rounded text-[9px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSpaceSelect(space);
                  }}
                >
                  View Details
                </button>
              </div>
            </div>

            <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-300 rounded-lg pointer-events-none transition-all duration-300"></div>
          </div>
        );
      })}

      <style jsx>{`
        .py-list-root { --card-bg: #ffffff; --muted: #6b7280; color: var(--muted); }
        .dark .py-list-root { --card-bg: #0b1220; --muted: #9fb0c8; color: var(--muted); }
        .py-list-root::-webkit-scrollbar { width: 4px; }
        .py-list-root::-webkit-scrollbar-track { background: transparent; border-radius: 10px; }
        .py-list-root::-webkit-scrollbar-thumb { background: linear-gradient(135deg,#3b82f6,#8b5cf6); border-radius: 10px; }
        .py-list-root::-webkit-scrollbar-thumb:hover { background: linear-gradient(135deg,#2563eb,#7c3aed); }
        .py-list-root .bg-white\\/90 { background: linear-gradient(180deg, rgba(255,255,255,0.92), rgba(250,250,250,0.94)); }
        .dark .py-list-root .bg-white\\/90 { background: linear-gradient(180deg, rgba(12,18,28,0.85), rgba(11,17,26,0.9)); }
      `}</style>
    </div>
  );
}