import type { PublicUser } from '@expense-tracker/shared';
import { LogoutButton } from '@/features/auth';

export function Header({ user }: { user: PublicUser }) {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-xl items-center justify-between px-6 py-3">
        <span className="font-semibold">Expense Tracker</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{user.name}</span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
