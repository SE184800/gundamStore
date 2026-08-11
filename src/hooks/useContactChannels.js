import { useMemo } from "react";
import { useCms } from "../store/CmsStore";

const defaultCommunications = [
  { id: "1", name: "Zalo hỗ trợ CSKH", platform: "Zalo", value: "https://zalo.me/0935950649", status: "Active", active: true },
  { id: "2", name: "Facebook Fanpage", platform: "Facebook", value: "https://www.facebook.com/gundamstorevn", status: "Active", active: true },
  { id: "3", name: "Hotline Tư vấn 24/7", platform: "Hotline", value: "0935950649", status: "Maintenance", active: false },
];

function isAvailable(c) {
  if (c.active === false) return false;
  const currentStatus = String(c.status || "Active").toLowerCase();
  if (currentStatus === "inactive" || currentStatus === "maintenance") return false;
  return true;
}

// Single source of truth for the real Zalo/Messenger channels, shared by the
// floating chat widget and any other UI (e.g. product page "Chat shop") that
// needs to link to the same, CMS-configurable contact channel.
export default function useContactChannels() {
  const { state } = useCms();

  const allCommunications = useMemo(() => {
    const currentStoreList = state.communications || [];
    const baseRows = defaultCommunications.map((d) => currentStoreList.find((c) => String(c.id) === String(d.id)) || d);
    const extraRows = currentStoreList.filter((c) => !defaultCommunications.some((d) => String(d.id) === String(c.id)));
    return [...baseRows, ...extraRows];
  }, [state.communications]);

  const zaloUrl = useMemo(() => {
    const primaryZalo = allCommunications.find((c) => String(c.id) === "1" && c.platform === "Zalo" && isAvailable(c));
    if (primaryZalo) return primaryZalo.value;
    const backupZalo = allCommunications.find((c) => c.platform === "Zalo" && isAvailable(c));
    return backupZalo ? backupZalo.value : "";
  }, [allCommunications]);

  const facebookUrl = useMemo(() => {
    const primaryFB = allCommunications.find((c) => String(c.id) === "2" && c.platform === "Facebook" && isAvailable(c));
    if (primaryFB) return primaryFB.value;
    const backupFB = allCommunications.find((c) => c.platform === "Facebook" && isAvailable(c));
    return backupFB ? backupFB.value : "";
  }, [allCommunications]);

  return { zaloUrl, facebookUrl };
}
