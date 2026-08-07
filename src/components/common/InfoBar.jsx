import { Headset, MapPinned, PackageSearch } from "lucide-react";
import { useI18n } from "../../i18n";

// Phone number reused from FloatingChat.jsx's support channel list — that
// channel is currently flagged status:"Maintenance", active:false for the
// Hotline entry specifically (the Zalo channel using the same number is
// Active). Double-check that flag before shipping this bar live.
const HOTLINE_NUMBER = "0935950649";

export default function InfoBar() {
  const { t } = useI18n();

  return (
    <div className="relative z-10 border-b border-blue-100 bg-blue-950 text-white">
      <div className="mx-auto flex h-8 max-w-[1440px] items-center justify-between gap-3 px-3 text-[11px] font-bold sm:gap-4 sm:px-4 lg:px-8">
        <a href={`tel:${HOTLINE_NUMBER}`} className="flex items-center gap-1.5 truncate transition hover:text-blue-200">
          <Headset size={13} className="shrink-0" />
          <span className="truncate">{t("infoBar.hotline")}: {HOTLINE_NUMBER}</span>
        </a>
        <span className="hidden items-center gap-1.5 text-blue-200/90 md:flex">
          <MapPinned size={13} />
          {t("infoBar.shipping")}
        </span>
        <a href="/order-lookup" className="flex shrink-0 items-center gap-1.5 transition hover:text-blue-200">
          <PackageSearch size={13} />
          {t("infoBar.orderLookup")}
        </a>
      </div>
    </div>
  );
}
