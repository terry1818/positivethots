import { ReactNode, useEffect, useState } from "react";

interface StepTransitionProps {
  children: ReactNode;
  stepKey: number;
  direction: "forward" | "backward";
}

export const StepTransition = ({ children, stepKey, direction }: StepTransitionProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, [stepKey]);

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        isVisible
          ? "opacity-100 translate-x-0"
          : direction === "forward"
          ? "opacity-0 translate-x-8"
          : "opacity-0 -translate-x-8"
      }`}
    >
      {children}
    </div>
  );
};
