import logoImg from "@/assets/logo.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export const Logo = ({ size = "md", showText = true }: LogoProps) => {
  const imgSizes = {
    sm: "h-14",
    md: "h-20",
    lg: "h-28"
  };
  
  const textSizes = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-5xl"
  };

  return (
    <div className="flex items-center gap-2">
      <img src={logoImg} alt="Positive Thots" className={`${imgSizes[size]} w-auto`} />
      {showText && (
        <span 
          className={`${textSizes[size]} bg-gradient-to-r from-[hsl(320,70%,55%)] via-[hsl(340,60%,60%)] to-[hsl(320,70%,50%)] bg-clip-text text-transparent`}
          style={{ 
            fontFamily: "'Pacifico', cursive",
            WebkitTextStroke: '1.5px white',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3), 0 0 10px hsl(320 70% 55% / 0.4)',
            paintOrder: 'stroke fill',
          }}
        >
          Positive Thots
        </span>
      )}
    </div>
  );
};
