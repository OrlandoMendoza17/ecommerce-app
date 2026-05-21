"use client";

import QuickActionsCard from "../QuickActionsCard/QuickActionsCard";
import { QuickActionsCardProps } from "../QuickActionsCard/QuickActionsCard.types";

import { FaCalendarAlt, FaUserPlus, FaDollarSign, FaShieldAlt } from "react-icons/fa";
import { FaPlus, FaMapMarkerAlt, FaCog, FaChartBar } from "react-icons/fa";

const AdminQuickActions = () => {

  const actions: QuickActionsCardProps[] = [
    {
      Icon: FaCalendarAlt,
      label: "Crear Evento",
      href: "/admin/calendar-events",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      Icon: FaUserPlus,
      label: "Agregar Miembro",
      href: "/admin/members",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      Icon: FaDollarSign,
      label: "Registrar Pago",
      href: "/admin/payments",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      Icon: FaShieldAlt,
      label: "Crear Equipo",
      href: "/admin/teams/create",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      Icon: FaPlus,
      label: "Plan Inscripción",
      href: "/admin/enrollments/create",
      color: "text-pink-600",
      bgColor: "bg-pink-100",
    },
    {
      Icon: FaMapMarkerAlt,
      label: "Ubicaciones",
      href: "/admin/ubicaciones",
      color: "text-teal-600",
      bgColor: "bg-teal-100",
    },
    {
      Icon: FaCog,
      label: "Configuración",
      href: "/admin/settings",
      color: "text-gray-600",
      bgColor: "bg-gray-100",
    },
    {
      Icon: FaChartBar,
      label: "Contabilidad",
      href: "/admin/accounting",
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
  ];

  return (
    <section>
      <h2 className="text-lg md:text-2xl font-bold mb-4">Accesos Rápidos</h2>
      <div className="grid gap-1 md:gap-3 grid-cols-2 md:grid-cols-4">
        {actions.map((action) => {
          return (
            <QuickActionsCard key={action.label} {...action} />
          );
        })}
      </div>
    </section>
  );
};

export default AdminQuickActions;
