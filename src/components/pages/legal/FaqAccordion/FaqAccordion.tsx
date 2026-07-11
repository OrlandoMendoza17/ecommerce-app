"use client";

import { cn } from "@/lib/utils";

export interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
  className?: string;
}

export default function FaqAccordion({ items, className = "" }: FaqAccordionProps) {
  return (
    <div className={cn("divide-y divide-gray-200 border-y border-gray-200", className)}>
      {items.map((item) => (
        <details key={item.question} className="group py-4">
          <summary className="cursor-pointer list-none text-base font-semibold text-gray-900 marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="flex items-start justify-between gap-4">
              {item.question}
              <span
                className="mt-0.5 shrink-0 text-gray-400 transition-transform group-open:rotate-180"
                aria-hidden
              >
                ▾
              </span>
            </span>
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-gray-700">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
