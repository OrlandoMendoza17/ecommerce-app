import { Users, Shield, UserCheck } from "lucide-react";
import { Calendar, FileCheck, DollarSign } from "lucide-react";
import { UserCog, AlertCircle, UserPlus } from "lucide-react";
import { Plus, MapPin, Settings } from "lucide-react";
import { BarChart3, Activity, Trophy } from "lucide-react";
import { StatCardIconKey, StatCardIconConfig } from "./StatCard.types";

export const STAT_CARD_ICONS: Record<StatCardIconKey, StatCardIconConfig> = {
  users: {
    icon: Users,
    color: "text-info-foreground",
    bgColor: "bg-info",
  },
  shield: {
    icon: Shield,
    color: "text-success-foreground",
    bgColor: "bg-success",
  },
  userCheck: {
    icon: UserCheck,
    color: "text-purple-foreground",
    bgColor: "bg-purple",
  },
  calendar: {
    icon: Calendar,
    color: "text-warning-foreground",
    bgColor: "bg-warning",
  },
  fileCheck: {
    icon: FileCheck,
    color: "text-warning-foreground",
    bgColor: "bg-warning",
  },
  dollarSign: {
    icon: DollarSign,
    color: "text-info-foreground",
    bgColor: "bg-info",
  },
  userCog: {
    icon: UserCog,
    color: "text-purple-foreground",
    bgColor: "bg-purple",
  },
  alertCircle: {
    icon: AlertCircle,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
  userPlus: {
    icon: UserPlus,
    color: "text-success-foreground",
    bgColor: "bg-success",
  },
  plus: {
    icon: Plus,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
  mapPin: {
    icon: MapPin,
    color: "text-success-foreground",
    bgColor: "bg-success",
  },
  settings: {
    icon: Settings,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
  barChart: {
    icon: BarChart3,
    color: "text-indigo-foreground",
    bgColor: "bg-indigo",
  },
  activity: {
    icon: Activity,
    color: "text-info-foreground",
    bgColor: "bg-info",
  },
  trophy: {
    icon: Trophy,
    color: "text-warning-foreground",
    bgColor: "bg-warning",
  },
};
