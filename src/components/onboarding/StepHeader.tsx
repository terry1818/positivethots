interface StepHeaderProps {
  /** Kept for callers; the step's guide art above the header carries the picture now. */
  emoji?: string;
  title: string;
  subtitle?: string;
}

export const StepHeader = ({ title, subtitle }: StepHeaderProps) => {
  return (
    <div className="mb-4 space-y-1.5 text-center">
      <h2 className="text-xl font-extrabold leading-tight text-foreground animate-stagger-1 [text-wrap:balance]">{title}</h2>
      {subtitle && (
        <p className="text-sm text-muted-foreground animate-stagger-2 [text-wrap:pretty]">{subtitle}</p>
      )}
    </div>
  );
};
