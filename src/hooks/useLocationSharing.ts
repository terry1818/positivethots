import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LocationData {
  user_id: string;
  latitude: number;
  longitude: number;
  is_sharing: boolean;
  updated_at: string;
  expires_at: string;
}

interface NearbyUser {
  user_id: string;
  latitude: number;
  longitude: number;
  distance: number; // in meters
  updated_at: string;
}

const FOUNDATION_BADGE_COUNT = 5;
const UPDATE_INTERVAL_MS = 30_000; // update position every 30s
const NEARBY_RADIUS_M = 500; // 500 meters default

/** Haversine distance in meters */
function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const useLocationSharing = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isEventLocationUnlocked, setIsEventLocationUnlocked] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userIdRef = useRef<string | null>(null);

  // Check if user has earned all foundation badges
  const checkUnlock = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      userIdRef.current = session.user.id;

      const { data: modules } = await supabase
        .from("education_modules")
        .select("id")
        .eq("tier", "foundation");

      const foundationModuleIds = (modules || []).map((m) => m.id);

      const { data: badges } = await supabase
        .from("user_badges")
        .select("module_id")
        .eq("user_id", session.user.id)
        .in("module_id", foundationModuleIds);

      const earned = (badges || []).length;
      setIsUnlocked(earned >= FOUNDATION_BADGE_COUNT);

      // Check advanced tier completion for event location sharing
      const { data: advancedModules } = await supabase
        .from("education_modules")
        .select("id")
        .eq("tier", "advanced");

      const advancedIds = (advancedModules || []).map(m => m.id);

      const { data: advancedBadges } = await supabase
        .from("user_badges")
        .select("module_id")
        .eq("user_id", session.user.id)
        .in("module_id", advancedIds.length > 0 ? advancedIds : ["__none__"]);

      const advancedEarned = (advancedBadges || []).length;
      setIsEventLocationUnlocked(advancedEarned >= advancedIds.length && advancedIds.length > 0);

      // Check current sharing status
      const { data: loc } = await supabase
        .from("user_locations" as any)
        .select("is_sharing, expires_at")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (loc && (loc as any).is_sharing && new Date((loc as any).expires_at) > new Date()) {
        setIsSharing(true);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  // Upsert location to DB
  const upsertLocation = useCallback(async (lat: number, lng: number, sharing: boolean) => {
    if (!userIdRef.current) return;
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    
    const { error: upsertError } = await (supabase as any)
      .from("user_locations")
      .upsert({
        user_id: userIdRef.current,
        latitude: lat,
        longitude: lng,
        is_sharing: sharing,
        updated_at: new Date().toISOString(),
        expires_at: expiresAt,
      }, { onConflict: "user_id" });

    if (upsertError) setError(upsertError.message);
  }, []);

  // Start sharing location
  const startSharing = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setError(null);

    const onPosition = (pos: GeolocationPosition) => {
      const { latitude, longitude } = pos.coords;
      setCurrentPosition({ lat: latitude, lng: longitude });
      upsertLocation(latitude, longitude, true);
    };

    const onError = (err: GeolocationPositionError) => {
      setError(err.message);
      setIsSharing(false);
    };

    // Get initial position
    navigator.geolocation.getCurrentPosition(onPosition, onError, {
      enableHighAccuracy: true,
      timeout: 10_000,
    });

    // Watch for updates
    watchIdRef.current = navigator.geolocation.watchPosition(onPosition, onError, {
      enableHighAccuracy: true,
      maximumAge: UPDATE_INTERVAL_MS,
    });

    setIsSharing(true);
  }, [upsertLocation]);

  // Stop sharing
  const stopSharing = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsSharing(false);
    setNearbyUsers([]);

    if (userIdRef.current) {
      await (supabase as any)
        .from("user_locations")
        .update({ is_sharing: false })
        .eq("user_id", userIdRef.current);
    }
  }, []);

  // Toggle sharing
  const toggleSharing = useCallback(() => {
    if (isSharing) {
      stopSharing();
    } else {
      startSharing();
    }
  }, [isSharing, startSharing, stopSharing]);

  // Fetch nearby users
  const fetchNearby = useCallback(async () => {
    if (!currentPosition || !userIdRef.current) return;

    const { data } = await (supabase as any)
      .from("user_locations")
      .select("user_id, latitude, longitude, updated_at")
      .eq("is_sharing", true)
      .gt("expires_at", new Date().toISOString())
      .neq("user_id", userIdRef.current);

    if (!data) return;

    const nearby: NearbyUser[] = (data as any[])
      .map((loc) => ({
        user_id: loc.user_id,
        latitude: loc.latitude,
        longitude: loc.longitude,
        updated_at: loc.updated_at,
        distance: haversineDistance(
          currentPosition.lat, currentPosition.lng,
          loc.latitude, loc.longitude
        ),
      }))
      .filter((u) => u.distance <= NEARBY_RADIUS_M)
      .sort((a, b) => a.distance - b.distance);

    setNearbyUsers(nearby);
  }, [currentPosition]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!isSharing || !currentPosition) return;

    fetchNearby();

    const channel = supabase
      .channel("nearby-locations")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "user_locations",
      }, () => {
        fetchNearby();
      })
      .subscribe();

    // Poll every 30s as backup
    intervalRef.current = setInterval(fetchNearby, UPDATE_INTERVAL_MS);

    return () => {
      supabase.removeChannel(channel);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isSharing, currentPosition, fetchNearby]);

  // Initial check
  useEffect(() => {
    checkUnlock();
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [checkUnlock]);

  return {
    isUnlocked,
    isSharing,
    loading,
    nearbyUsers,
    currentPosition,
    error,
    toggleSharing,
    startSharing,
    stopSharing,
    fetchNearby,
  };
};
