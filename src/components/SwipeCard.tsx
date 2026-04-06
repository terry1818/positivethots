import { useState, useRef, useEffect } from "react";
import { Heart, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Profile {
  id: number;
  name: string;
  age: number;
  bio: string;
  image: string;
  location: string;
}

interface SwipeCardProps {
  profile: Profile;
  onSwipe: (direction: "left" | "right") => void;
  isTop: boolean;
}

export const SwipeCard = ({ profile, onSwipe, isTop }: SwipeCardProps) => {
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [animate, setAnimate] = useState<"left" | "right" | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (clientX: number, clientY: number) => {
    if (!isTop) return;
    setIsDragging(true);
    setDragStart({ x: clientX, y: clientY });
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging || !isTop) return;
    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleDragEnd = () => {
    if (!isDragging || !isTop) return;
    setIsDragging(false);

    const threshold = 100;
    if (Math.abs(dragOffset.x) > threshold) {
      const direction = dragOffset.x > 0 ? "right" : "left";
      setAnimate(direction);
      setTimeout(() => onSwipe(direction), 300);
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  };

  const handleButtonSwipe = (direction: "left" | "right") => {
    if (!isTop) return;
    setAnimate(direction);
    setTimeout(() => onSwipe(direction), 300);
  };

  const rotation = isDragging ? dragOffset.x / 20 : 0;
  const opacity = isDragging ? 1 - Math.abs(dragOffset.x) / 300 : 1;

  return (
    <div
      ref={cardRef}
      className={`absolute inset-0 select-none ${
        animate === "left"
          ? "animate-swipe-left"
          : animate === "right"
          ? "animate-swipe-right"
          : ""
      }`}
      style={{
        transform: isDragging
          ? `translateX(${dragOffset.x}px) translateY(${dragOffset.y}px) rotate(${rotation}deg)`
          : "none",
        opacity: isDragging ? opacity : 1,
        transition: isDragging ? "none" : "transform 0.3s ease, opacity 0.3s ease",
        cursor: isTop ? "grab" : "default",
        zIndex: isTop ? 10 : 1,
      }}
      onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
      onMouseMove={(e) => handleDragMove(e.clientX, e.clientY)}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onTouchStart={(e) => handleDragStart(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={(e) => handleDragMove(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={handleDragEnd}
    >
      <Card className="relative h-full w-full overflow-hidden rounded-3xl shadow-[var(--shadow-elevated)] border-0">
        <img
          src={profile.image}
          alt={profile.name}
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Swipe indicators */}
        {isDragging && (
          <>
            <div
              className="absolute top-8 left-8 text-6xl font-bold text-success border-4 border-success rounded-2xl px-6 py-3 rotate-[-20deg]"
              style={{ opacity: Math.min(dragOffset.x / 100, 1) }}
            >
              Connect
            </div>
            <div
              className="absolute top-8 right-8 text-6xl font-bold text-destructive border-4 border-destructive rounded-2xl px-6 py-3 rotate-[20deg]"
              style={{ opacity: Math.min(-dragOffset.x / 100, 1) }}
            >
              NOPE
            </div>
          </>
        )}

        {/* Profile info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h2 className="text-4xl font-bold mb-2">
            {profile.name}, {profile.age}
          </h2>
          <p className="text-lg mb-2 opacity-90">{profile.location}</p>
          <p className="text-base opacity-80 line-clamp-2">{profile.bio}</p>
        </div>
      </Card>

      {/* Action buttons */}
      {isTop && (
        <div className="absolute bottom-[-80px] left-1/2 -translate-x-1/2 flex gap-6">
          <Button
            size="lg"
            variant="outline"
            className="h-16 w-16 rounded-full border-4 border-destructive bg-background hover:bg-destructive hover:text-destructive-foreground transition-all shadow-lg hover:scale-110"
            onClick={() => handleButtonSwipe("left")}
          >
            <X className="h-8 w-8" />
          </Button>
          <Button
            size="lg"
            className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-secondary hover:scale-110 transition-all shadow-[var(--shadow-card)]"
            onClick={() => handleButtonSwipe("right")}
          >
            <Heart className="h-10 w-10 fill-current" />
          </Button>
        </div>
      )}
    </div>
  );
};
