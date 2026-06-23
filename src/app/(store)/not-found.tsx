import StatusPage from "@/components/shared/StatusPage/StatusPage";
import { storeNotFoundPreset } from "@/components/shared/StatusPage/status-page.presets";

export default function StoreNotFound() {
  return (
    <StatusPage
      {...storeNotFoundPreset}
      className="min-h-[60vh]"
    />
  );
}
