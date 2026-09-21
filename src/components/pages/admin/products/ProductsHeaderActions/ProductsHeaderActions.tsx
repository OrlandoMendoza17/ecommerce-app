"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ProductsHeaderActions() {
  return (
    <Button asChild className="gap-1.5 text-xs sm:text-sm">
      <Link href="/admin/products/create">
        <Plus className="size-4" />
        <span>Crear producto</span>
      </Link>
    </Button>
  );
}
