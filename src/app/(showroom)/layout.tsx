import { ShowroomShell } from "@/components/showroom/ShowroomShell";

export default function ShowroomLayout({ children }: { children: React.ReactNode }) {
  return <ShowroomShell>{children}</ShowroomShell>;
}
