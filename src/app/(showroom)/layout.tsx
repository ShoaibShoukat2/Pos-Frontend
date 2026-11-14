import { ShowroomShell } from "@/components/showroom/ShowroomShell";

export default function ShowroomLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full min-h-0">
      <ShowroomShell>{children}</ShowroomShell>
    </div>
  );
}
