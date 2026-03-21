import React from "react";
import { cn } from "@/lib/utils";

interface StaggerChildrenProps {
  children: React.ReactNode;
  className?: string;
  delay?: number; // base delay in ms
  stagger?: number; // delay between each child in ms
}

export const StaggerChildren = ({ children, className, delay = 0, stagger = 80 }: StaggerChildrenProps) => {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <div
          className={cn("opacity-0 animate-stagger-fade")}
          style={{ animationDelay: `${delay + index * stagger}ms`, animationFillMode: "both" }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};
