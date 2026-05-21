"use client"

import * as React from "react"

import { AdminSidebar } from "./AdminSidebar/AdminSidebar"
import { Header } from "./Header/Header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

interface AdminPanelProps {
  children: React.ReactNode
  page: string
  searchPlaceholder?: string
}

export function AdminPanel({
  children,
  page,
  searchPlaceholder
}: AdminPanelProps) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <Header page={page} searchPlaceholder={searchPlaceholder} />
        <main className="flex-1 overflow-y-auto bg-muted min-h-0 p-2 sm:p-5 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

