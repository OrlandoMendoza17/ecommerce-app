import Link from "next/link";
import { Button } from "@/components/ui/button";
import { QuickActionsCardProps } from "./QuickActionsCard.types";

const QuickActionsCard = (props: QuickActionsCardProps) => {
  const { label, href, Icon, color, bgColor } = props;
  return (
    <Link href={href}>
      <Button
        variant="outline"
        className="w-full h-auto flex-col gap-2 p-4 hover:bg-muted"
      >
        <div className={`${bgColor} p-3 rounded-full`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <span className="text-sm font-medium">{label}</span>
      </Button>
    </Link>
  );
};

export default QuickActionsCard;
