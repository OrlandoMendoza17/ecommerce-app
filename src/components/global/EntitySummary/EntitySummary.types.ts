// EntitySummary types and interfaces

// Component Props

export type ItemValue = string | number | Date | null;
export type NormalItem = [string, ItemValue];
export type LinkItem = [string, ItemValue, string];
export type Item = NormalItem | LinkItem | null;

export interface EntitySummaryProps {
  className?: string;
  items: Item[];
}
