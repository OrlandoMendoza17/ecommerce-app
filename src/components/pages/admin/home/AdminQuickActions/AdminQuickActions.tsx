import QuickActionsCard from "../QuickActionsCard/QuickActionsCard";
import { getAdminQuickActions } from "./AdminQuickActions.helpers";

const AdminQuickActions = () => {
  const actions = getAdminQuickActions();

  return (
    <section>
      <h2 className="text-lg md:text-2xl font-bold mb-4">Accesos Rápidos</h2>
      <div className="grid gap-1 md:gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
        {actions.map((action) => (
          <QuickActionsCard key={action.href} {...action} />
        ))}
      </div>
    </section>
  );
};

export default AdminQuickActions;
