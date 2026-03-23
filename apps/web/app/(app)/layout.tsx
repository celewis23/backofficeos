import { Sidebar } from "@/components/layout/sidebar";
import { CommandPalette } from "@/components/command-palette";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {children}
      </div>
      <CommandPalette />
    </div>
  );
}
