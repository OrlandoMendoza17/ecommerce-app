import { Users, Shield, UserCheck } from "lucide-react";
import { Calendar, FileCheck, DollarSign } from "lucide-react";
import { UserCog, AlertCircle, UserPlus } from "lucide-react";
import { Plus, MapPin, Settings } from "lucide-react";
import { BarChart3, Activity, Trophy } from "lucide-react";
import { StatCardIconKey, StatCardIconConfig } from "./StatCard.types";

export const STAT_CARD_ICONS: Record<StatCardIconKey, StatCardIconConfig> = {
  users: {
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  shield: {
    icon: Shield,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  userCheck: {
    icon: UserCheck,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  calendar: {
    icon: Calendar,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  fileCheck: {
    icon: FileCheck,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  dollarSign: {
    icon: DollarSign,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  userCog: {
    icon: UserCog,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  alertCircle: {
    icon: AlertCircle,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
  },
  userPlus: {
    icon: UserPlus,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  plus: {
    icon: Plus,
    color: "text-pink-600",
    bgColor: "bg-pink-100",
  },
  mapPin: {
    icon: MapPin,
    color: "text-teal-600",
    bgColor: "bg-teal-100",
  },
  settings: {
    icon: Settings,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
  },
  barChart: {
    icon: BarChart3,
    color: "text-indigo-600",
    bgColor: "bg-indigo-100",
  },
  activity: {
    icon: Activity,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  trophy: {
    icon: Trophy,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
  },
};
