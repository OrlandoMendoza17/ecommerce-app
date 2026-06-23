import StatusPage from "@/components/shared/StatusPage/StatusPage";
import { adminNotFoundPreset } from "@/components/shared/StatusPage/status-page.presets";

export default function AdminNotFound() {
  return (
    <StatusPage
      {...adminNotFoundPreset}
      className="min-h-[50vh]"
    />
  );
}
