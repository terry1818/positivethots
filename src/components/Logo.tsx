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
          className={`${textSizes[size]} text-secondary drop-shadow-sm`}
          style={{ fontFamily: "'Pacifico', cursive" }}
        >
          Positive Thots
        </span>
      )}
    </div>
  );
};
