import { AlertCircle } from "lucide-react";

export function FieldError({ message, id }: { message?: string; id?: string }) {
  if (!message) return null;
  return (
    <p role="alert" id={id} className="text-sm text-destructive flex items-center gap-1 mt-1 animate-fade-in">
      <AlertCircle className="h-3 w-3 shrink-0" /> {message}
    </p>
  );
}
