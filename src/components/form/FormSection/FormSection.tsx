import { twMerge } from "tailwind-merge";

import { FormSectionProps as Props } from "./FormSection.types";
import MoreInfoTooltip from "@/components/widgets/MoreInfoTooltip/MoreInfoTooltip";

const FormSection = (props: Props) => {
  const { className, title, description, children, contentClassName } = props;

  const renderTitle = () => {
    return (
      <div className="flex items-center gap-2">
        <h4 className="text-lg font-semibold">{title}</h4>
        <MoreInfoTooltip className="block xl:hidden">
          {description}
        </MoreInfoTooltip>
      </div>
    );
  };

  return (
    <section
      className={twMerge("FormSection col-start-1 flex gap-4", className)}
    >
      {title && description ? (
        <div className="hidden border-t px-0 py-6 lg:w-40 xl:w-64 [@media(min-width:1200px)]:block">
          {renderTitle()}
          <div className="text-muted-foreground hidden xl:block">
            {description}
          </div>
        </div>
      ) : null}
      <div
        className={twMerge(
          "dark:bg-black/20 flex flex-1 flex-col gap-4 rounded pl-2 sm:pl-6 py-4 md:py-6",
          contentClassName
        )}
      >
        {children}
      </div>
    </section>
  );
};

export default FormSection;
