import { Badge } from "@/components/ui/badge";

interface MiniProfilePreviewProps {
  name: string;
  profileImage?: string | null;
  fields: { label: string; value: string }[];
  visible: boolean;
}

export const MiniProfilePreview = ({ name, profileImage, fields, visible }: MiniProfilePreviewProps) => {
  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 animate-slide-up">
      <div className="bg-card border border-border rounded-2xl shadow-[var(--shadow-elevated)] px-4 py-3 flex items-center gap-3 max-w-xs">
        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
          {profileImage ? (
            <img src={profileImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm font-bold text-primary">{name.charAt(0)}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{name}</p>
          <div className="flex flex-wrap gap-1 mt-0.5">
            {fields.filter(f => f.value).slice(0, 3).map(f => (
              <Badge key={f.label} variant="secondary" className="text-sm py-0 px-1.5">
                {f.value}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
