interface StepHeaderProps {
  emoji: string;
  title: string;
  subtitle?: string;
}

export const StepHeader = ({ emoji, title, subtitle }: StepHeaderProps) => {
  return (
    <div className="text-center space-y-2 mb-4">
      <span className="text-4xl block animate-bounce-in">{emoji}</span>
      <h2 className="text-xl font-bold text-foreground animate-stagger-1">{title}</h2>
      {subtitle && (
        <p className="text-sm text-muted-foreground animate-stagger-2">{subtitle}</p>
      )}
    </div>
  );
};
