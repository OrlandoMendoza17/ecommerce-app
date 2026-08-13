"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

const STATUSES = [
  "ACTIVE",
  "INACTIVE",
  "PENDING",
  "PROCESSING",
  "FAILED",
  "NOT_FULFILLED",
] as const;

const NAMES = [
  "Ana Torres",
  "Carlos Ruiz",
  "María López",
  "Luis Gómez",
  "Sofía Díaz",
] as const;

const PRODUCTS = [
  "Bate Pro X",
  "Guante Elite",
  "Pelota Oficial",
  "Casco Storm",
  "Cleats Runner",
] as const;

function randomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomId() {
  return crypto.randomUUID();
}

export default function TestPage() {
  const [seed, setSeed] = useState(0);

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Test · EntitySummary
          </h1>
          <p className="text-sm text-muted-foreground">
            Datos aleatorios para probar labels, links, fechas, IDs y status.
          </p>
        </div>
        <Button type="button" onClick={() => setSeed((value) => value + 1)}>
          Regenerar datos
        </Button>
      </div>
    </main>
  );
}
