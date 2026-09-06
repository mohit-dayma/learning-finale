import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";

export function AppHeader({
  userName,
  userEmail,
}: {
  userName: string;
  userEmail: string;
}): React.JSX.Element {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 p-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="font-semibold">
            SkillForge
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
              Today
            </Link>
            <Link href="/interview" className="text-muted-foreground hover:text-foreground">
              Interview
            </Link>
            <Link href="/career" className="text-muted-foreground hover:text-foreground">
              Career
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium">{userName}</span>
            <span className="text-xs text-muted-foreground">{userEmail}</span>
          </div>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
