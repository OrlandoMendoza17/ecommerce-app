import StatusPage from "@/components/shared/StatusPage/StatusPage";
import { rootNotFoundPreset } from "@/components/shared/StatusPage/status-page.presets";

export default function NotFound() {
  return (
    <StatusPage
      {...rootNotFoundPreset}
      className="min-h-screen"
    />
  );
}
