import StoreLayoutShell from "@/components/widgets/StoreLayoutShell/StoreLayoutShell";

export default function StoreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <StoreLayoutShell>{children}</StoreLayoutShell>;
}
