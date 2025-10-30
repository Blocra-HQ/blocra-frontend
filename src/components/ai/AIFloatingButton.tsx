import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

interface AIFloatingButtonProps {
  onClick: () => void;
}

export function AIFloatingButton({ onClick }: AIFloatingButtonProps) {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-4 right-4 w-14 h-14 rounded-full glow-primary z-40 shadow-lg"
      size="icon"
    >
      <MessageCircle className="w-6 h-6" />
    </Button>
  );
}