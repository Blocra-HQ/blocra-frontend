import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { Link } from "react-router-dom";

export function BackToHomeButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      asChild
      className="mb-4"
    >
      <Link to="/">
        <Home className="mr-2 h-4 w-4" />
        Back to Home
      </Link>
    </Button>
  );
}