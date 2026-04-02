import logoImg from "@/assets/logo.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export const Logo = ({ size = "md" }: LogoProps) => {
  const imgSizes = {
    sm: "h-10",
    md: "h-14",
    lg: "h-36"
  };

  return (
    <div className="flex items-center">
      <img src={logoImg} alt="Positive Thots" className={`${imgSizes[size]} w-auto`} />
    </div>
  );
};
