import { SidebarProvider } from "@/components/ui/sidebar";

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full">
        {children}
      </div>
    </SidebarProvider>
  );
};