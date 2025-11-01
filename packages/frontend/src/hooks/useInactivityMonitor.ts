import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/api";

interface InactivityStatus {
  minutesSinceLastActivity: number;
  warningMinutesRemaining: number;
  shouldShowWarning: boolean;
  shouldShowAutoCheckout: boolean;
}

const WARNING_THRESHOLD = 35;
const CHECKOUT_THRESHOLD = 45;

export function useInactivityMonitor() {
  const { user } = useAuth();
  const [lastKnownActivity, setLastKnownActivity] = useState<Date | null>(null);

  const { data: userData } = useQuery({
    queryKey: ["user"],
    queryFn: () => authApi.me().then((res) => res.data.user),
    enabled: !!user,
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (userData?.lastActivityAt) {
      const parsed = new Date(userData.lastActivityAt);
      if (!lastKnownActivity || parsed.getTime() !== lastKnownActivity.getTime()) {
        setLastKnownActivity(parsed);
      }
    }
  }, [userData?.lastActivityAt]);

  const calculateInactivity = (): InactivityStatus => {
    if (!lastKnownActivity || !user?.currentRoomId) {
      return {
        minutesSinceLastActivity: 0,
        warningMinutesRemaining: 0,
        shouldShowWarning: false,
        shouldShowAutoCheckout: false,
      };
    }

    const now = new Date();
    const diffMs = now.getTime() - lastKnownActivity.getTime();
    const minutesSinceLastActivity = Math.floor(diffMs / 60000);

    const shouldShowWarning = minutesSinceLastActivity >= WARNING_THRESHOLD;
    const shouldShowAutoCheckout = minutesSinceLastActivity >= CHECKOUT_THRESHOLD;
    const warningMinutesRemaining = Math.max(0, CHECKOUT_THRESHOLD - minutesSinceLastActivity);

    return {
      minutesSinceLastActivity,
      warningMinutesRemaining,
      shouldShowWarning,
      shouldShowAutoCheckout,
    };
  };

  const status = calculateInactivity();

  return {
    ...status,
    hasActiveRoom: !!user?.currentRoomId,
    lastKnownActivity,
  };
}

