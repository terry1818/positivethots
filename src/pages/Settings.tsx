import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { ChevronLeft, Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    { value: "light", label: "Light", desc: "Always use light mode", icon: Sun },
    { value: "dark", label: "Dark", desc: "Always use dark mode", icon: Moon },
    { value: "system", label: "System", desc: "Follow your device settings", icon: Monitor },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="container max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Logo size="md" />
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </header>

      <main className="flex-1 container max-w-md mx-auto px-4 py-6 space-y-4">
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg">Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={theme} onValueChange={setTheme} className="space-y-3">
              {themeOptions.map(({ value, label, desc, icon: Icon }, idx) => (
                <div
                  key={value}
                  className={cn(
                    "flex items-center space-x-3 border rounded-lg p-3 cursor-pointer transition-all duration-300 animate-stagger-fade",
                    theme === value && "border-primary shadow-[0_0_12px_-4px_hsl(var(--primary)/0.3)] bg-primary/5"
                  )}
                  style={{ animationDelay: `${idx * 80}ms` }}
                  onClick={() => setTheme(value)}
                >
                  <RadioGroupItem value={value} id={value} />
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <Label htmlFor={value} className="flex-1 cursor-pointer">
                    <span className="font-medium">{label}</span>
                    <span className="block text-sm text-muted-foreground">{desc}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Settings;
