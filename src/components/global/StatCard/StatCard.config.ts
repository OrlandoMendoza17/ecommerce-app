import { Users, Shield, UserCheck } from "lucide-react";
import { Calendar, FileCheck, DollarSign } from "lucide-react";
import { UserCog, AlertCircle, UserPlus } from "lucide-react";
import { Plus, MapPin, Settings } from "lucide-react";
import { BarChart3, Activity, Trophy } from "lucide-react";
import { StatCardIconKey, StatCardIconConfig } from "./StatCard.types";

export const STAT_CARD_ICONS: Record<StatCardIconKey, StatCardIconConfig> = {
  users: {
    icon: Users,
    color: "text-info",
    bgColor: "bg-info-foreground-foreground",
  },
  shield: {
    icon: Shield,
    color: "text-success",
    bgColor: "bg-success-foreground-foreground",
  },
  userCheck: {
    icon: UserCheck,
    color: "text-purple",
    bgColor: "bg-purple-foreground",
  },
  calendar: {
    icon: Calendar,
    color: "text-warning",
    bgColor: "bg-warning-foreground-foreground",
  },
  fileCheck: {
    icon: FileCheck,
    color: "text-warning",
    bgColor: "bg-warning-foreground-foreground",
  },
  dollarSign: {
    icon: DollarSign,
    color: "text-info",
    bgColor: "bg-info-foreground-foreground",
  },
  userCog: {
    icon: UserCog,
    color: "text-purple",
    bgColor: "bg-purple-foreground",
  },
  alertCircle: {
    icon: AlertCircle,
    color: "text-muted",
    bgColor: "bg-muted-foreground",
  },
  userPlus: {
    icon: UserPlus,
    color: "text-success",
    bgColor: "bg-success-foreground-foreground",
  },
  plus: {
    icon: Plus,
    color: "text-muted",
    bgColor: "bg-muted-foreground",
  },
  mapPin: {
    icon: MapPin,
    color: "text-success",
    bgColor: "bg-success-foreground-foreground",
  },
  settings: {
    icon: Settings,
    color: "text-muted",
    bgColor: "bg-muted-foreground",
  },
  barChart: {
    icon: BarChart3,
    color: "text-indigo",
    bgColor: "bg-indigo-foreground-foreground",
  },
  activity: {
    icon: Activity,
    color: "text-info",
    bgColor: "bg-info-foreground-foreground",
  },
  trophy: {
    icon: Trophy,
    color: "text-warning",
    bgColor: "bg-warning-foreground-foreground",
  },
};
