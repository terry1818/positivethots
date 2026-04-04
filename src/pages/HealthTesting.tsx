import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ExternalLink, HeartPulse, MapPin, Shield, Info } from "lucide-react";
import { Logo } from "@/components/Logo";

const services = [
  {
    name: "Everlywell",
    url: "https://www.everlywell.com",
    description: "Comprehensive at-home STD panel with easy-to-read results",
    price: "$49",
    tag: "Popular",
  },
  {
    name: "LetsGetChecked",
    url: "https://www.letsgetchecked.com",
    description: "Fast results with dedicated nurse support included",
    price: "$99",
    tag: "Nurse Support",
  },
  {
    name: "myLAB Box",
    url: "https://www.mylabbox.com",
    description: "Discreet packaging and private, lab-certified results",
    price: "$79",
    tag: "Discreet",
  },
  {
    name: "Nurx",
    url: "https://www.nurx.com",
    description: "Test and treat in one — prescriptions included if needed",
    price: "$75",
    tag: "Test + Treat",
  },
];

const HealthTesting = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="container max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/learn")} aria-label="Go back">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Logo size="md" showText={false} />
          <h1 className="text-lg font-bold">Test From Home</h1>
        </div>
      </header>

      <main className="flex-1 container max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* FTC Disclosure */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
          <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Some links are affiliate links. We earn a small commission at no extra cost to you. We only recommend services that support our community's health.
          </p>
        </div>

        {/* Intro */}
        <div className="text-center space-y-1 py-2">
          <HeartPulse className="h-8 w-8 text-primary mx-auto" />
          <h2 className="text-lg font-bold">Test From Home</h2>
          <p className="text-sm text-muted-foreground">
            Regular testing is self-care. These services make it private, easy, and discreet.
          </p>
        </div>

        {/* Service Cards */}
        <div className="space-y-3">
          {services.map((service, idx) => (
            <Card
              key={service.name}
              className="animate-fade-in overflow-hidden"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold">{service.name}</h3>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </div>
                  <Badge variant="secondary" className="text-sm flex-shrink-0 ml-2">
                    {service.tag}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">
                    From {service.price}
                  </span>
                  <Button
                    size="sm"
                    className="min-h-[44px] min-w-[44px] gap-2"
                    onClick={() => window.open(service.url, "_blank", "noopener,noreferrer")}
                  >
                    Order Test <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* In-Person Link */}
        <Card className="animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-accent/10 p-2 flex-shrink-0">
                <MapPin className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold">Prefer in-person testing?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Find clinics and testing centers near you.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 min-h-[44px] gap-2"
                  onClick={() => navigate("/testing-locations")}
                >
                  <MapPin className="h-4 w-4" /> Find Testing Near You
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trust Note */}
        <div className="flex items-start gap-2 px-2 pb-4">
          <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            All recommended services use CLIA-certified labs and HIPAA-compliant processes. Your results are private and confidential.
          </p>
        </div>
      </main>
    </div>
  );
};

export default HealthTesting;
