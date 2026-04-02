import logoImg from "@/assets/logo.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export const Logo = ({ size = "md" }: LogoProps) => {
  const imgSizes = {
    sm: "h-14",
    md: "h-20",
    lg: "h-44"
  };

  return (
    <div className="flex items-center">
      <img src={logoImg} alt="Positive Thots" className={`${imgSizes[size]} w-auto`} />
    </div>
  );
};
