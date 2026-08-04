import { useEffect, useState } from "react";
import { getShopStatsApi } from "../services/ShopStatsApiService";

export default function useShopStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getShopStatsApi()
      .then((data) => {
        if (alive) setStats(data);
      })
      .catch(() => {
        if (alive) setStats(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return { stats, loading };
}
