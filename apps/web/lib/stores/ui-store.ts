"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIStore {
  // Sidebar
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  // Command palette
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;

  // AI assistant panel
  aiPanelOpen: boolean;
  setAiPanelOpen: (open: boolean) => void;
  setAIPanelOpen: (open: boolean) => void;
  toggleAiPanel: () => void;

  // Notification panel
  notificationPanelOpen: boolean;
  setNotificationPanelOpen: (open: boolean) => void;
  toggleNotificationPanel: () => void;
  unreadNotificationCount: number;
  setUnreadNotificationCount: (count: number) => void;

  // Current context (for AI assistant awareness)
  pageContext: {
    module: string | null;
    entityType: string | null;
    entityId: string | null;
    entityName: string | null;
  };
  setPageContext: (ctx: UIStore["pageContext"]) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

      aiPanelOpen: false,
      setAiPanelOpen: (open) => set({ aiPanelOpen: open }),
      setAIPanelOpen: (open) => set({ aiPanelOpen: open }),
      toggleAiPanel: () => set((s) => ({ aiPanelOpen: !s.aiPanelOpen })),

      notificationPanelOpen: false,
      setNotificationPanelOpen: (open) => set({ notificationPanelOpen: open }),
      toggleNotificationPanel: () => set((s) => ({ notificationPanelOpen: !s.notificationPanelOpen })),
      unreadNotificationCount: 0,
      setUnreadNotificationCount: (count) => set({ unreadNotificationCount: count }),

      pageContext: {
        module: null,
        entityType: null,
        entityId: null,
        entityName: null,
      },
      setPageContext: (ctx) => set({ pageContext: ctx }),
    }),
    {
      name: "backoffice-ui",
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }),
    }
  )
);
