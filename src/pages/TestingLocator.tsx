import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, MapPin, ExternalLink, Heart, Clock, Shield } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Skeleton } from "@/components/ui/skeleton";

const TestingLocator = () => {
  const navigate = useNavigate();
  const [mapLoaded, setMapLoaded] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="container max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/learn")} aria-label="Go back">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Logo size="md" showText={false} />
          <h1 className="text-lg font-bold">Find Testing Near You</h1>
        </div>
      </header>

      <main className="flex-1 container max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Map Section */}
        <Card className="overflow-hidden animate-fade-in">
          <div className="relative w-full" style={{ height: 400 }}>
            {!mapLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted">
                <MapPin className="h-8 w-8 text-muted-foreground animate-pulse mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            )}
            <iframe
              title="STD testing locations near you"
              src="https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d100000!2d-98.5!3d39.8!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1sSTD+testing+near+me!5e0!3m2!1sen!2sus"
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              onLoad={() => setMapLoaded(true)}
              style={{ opacity: mapLoaded ? 1 : 0, transition: "opacity 0.3s" }}
            />
          </div>
          <CardContent className="p-4">
            <Button
              variant="outline"
              className="w-full min-h-[44px] gap-2"
              onClick={() => window.open("https://www.google.com/maps/search/STD+testing+near+me", "_blank")}
            >
              <ExternalLink className="h-4 w-4" />
              Open in Google Maps
            </Button>
          </CardContent>
        </Card>

        {/* Supportive Copy */}
        <Card className="animate-fade-in bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2 flex-shrink-0">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Testing is an act of care</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Getting tested regularly is one of the most caring things you can do — for yourself and for your partners. It's a sign of responsibility, not shame.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Frequency Tip */}
        <Card className="animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-accent/10 p-2 flex-shrink-0">
                <Clock className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">How often should you test?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Most health professionals recommend STI testing every <strong className="text-foreground">3–6 months</strong> if you have multiple partners. Some situations may call for more frequent testing.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* At-Home Testing */}
        <Card className="animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-success/10 p-2 flex-shrink-0">
                <Shield className="h-5 w-5 text-success" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Prefer testing at home?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  At-home STI test kits are available from services like{" "}
                  <a href="https://www.stdcheck.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    STDcheck
                  </a>
                  ,{" "}
                  <a href="https://www.everlywell.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    Everlywell
                  </a>
                  , and{" "}
                  <a href="https://www.nurx.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    Nurx
                  </a>
                  . Discreet, convenient, and confidential.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Note */}
        <p className="text-sm text-muted-foreground text-center px-4 pb-4">
          🔒 We don't store your location. The map search runs entirely through Google Maps.
        </p>
      </main>
    </div>
  );
};

export default TestingLocator;
