import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface LegalPageLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  updatedAt?: string;
  className?: string;
  useProse?: boolean;
}

const legalProseClassName = cn(
  "prose prose-gray max-w-none",
  "prose-headings:scroll-mt-24",
  "prose-h2:text-xl prose-h2:font-semibold prose-h2:text-gray-900",
  "prose-h3:text-base prose-h3:font-semibold",
  "prose-p:text-gray-700 prose-p:leading-relaxed",
  "prose-li:text-gray-700",
  "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
  "[&_p]:my-3 sm:[&_p]:my-4 md:[&_p]:my-5",
  "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 sm:[&_ul]:my-4 sm:[&_ul]:pl-6 md:[&_ul]:my-5 md:[&_ul]:pl-7",
  "[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 sm:[&_ol]:my-4 sm:[&_ol]:pl-6 md:[&_ol]:my-5 md:[&_ol]:pl-7",
  "[&_li]:my-1.5 sm:[&_li]:my-2 md:[&_li]:my-2.5",
  "[&_h2]:mt-8 [&_h2]:mb-3 sm:[&_h2]:mt-9 sm:[&_h2]:mb-4 md:[&_h2]:mt-10 md:[&_h2]:mb-4",
  "[&_h3]:mt-6 [&_h3]:mb-2 sm:[&_h3]:mt-7 sm:[&_h3]:mb-3 md:[&_h3]:mt-8 md:[&_h3]:mb-3",
);

export default function LegalPageLayout({
  title,
  description,
  children,
  updatedAt = "10 de julio de 2026",
  className = "",
  useProse = true,
}: LegalPageLayoutProps) {
  return (
    <>
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 lg:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-base text-gray-600">{description}</p>
        </div>
      </div>

      <div className={cn("mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8", className)}>
        {useProse ? (
          <article className={legalProseClassName}>{children}</article>
        ) : (
          <div>{children}</div>
        )}
        <p className="mt-10 border-t border-gray-200 pt-6 text-sm text-gray-500">
          Última actualización: {updatedAt}
        </p>
      </div>
    </>
  );
}
