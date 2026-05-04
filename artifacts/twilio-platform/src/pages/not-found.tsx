import { Link } from "wouter";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <div className="size-16 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="size-8 text-destructive" />
      </div>
      <div>
        <h1 className="text-4xl font-bold tracking-tight">404</h1>
        <p className="text-xl font-semibold mt-2">Page Not Found</p>
        <p className="text-muted-foreground mt-2 max-w-sm">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <Link href="/">
        <Button variant="outline">
          <ArrowLeft className="size-4 mr-2" />
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
}
