import { LogOut } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
import { logoutAction } from '../api/actions';

interface LogoutButtonProps {
  /** `icon` — круглая кнопка с иконкой для узкой панели меню. */
  view?: 'button' | 'icon';
  className?: string;
}

export function LogoutButton({
  view = 'button',
  className,
}: LogoutButtonProps) {
  return (
    <form action={logoutAction} className={className}>
      {view === 'icon' ? (
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          aria-label="Выйти"
          title="Выйти"
          className={cn('text-sidebar-foreground')}
        >
          <LogOut />
        </Button>
      ) : (
        <Button type="submit" variant="outline">
          <LogOut />
          Выйти
        </Button>
      )}
    </form>
  );
}
