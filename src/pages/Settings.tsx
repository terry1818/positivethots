import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { ChevronLeft, Sun, Moon, Monitor } from "lucide-react";

const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

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
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={theme} onValueChange={setTheme} className="space-y-3">
              <div className="flex items-center space-x-3 border rounded-lg p-3 cursor-pointer" onClick={() => setTheme("light")}>
                <RadioGroupItem value="light" id="light" />
                <Sun className="h-5 w-5 text-muted-foreground" />
                <Label htmlFor="light" className="flex-1 cursor-pointer">
                  <span className="font-medium">Light</span>
                  <span className="block text-sm text-muted-foreground">Always use light mode</span>
                </Label>
              </div>
              <div className="flex items-center space-x-3 border rounded-lg p-3 cursor-pointer" onClick={() => setTheme("dark")}>
                <RadioGroupItem value="dark" id="dark" />
                <Moon className="h-5 w-5 text-muted-foreground" />
                <Label htmlFor="dark" className="flex-1 cursor-pointer">
                  <span className="font-medium">Dark</span>
                  <span className="block text-sm text-muted-foreground">Always use dark mode</span>
                </Label>
              </div>
              <div className="flex items-center space-x-3 border rounded-lg p-3 cursor-pointer" onClick={() => setTheme("system")}>
                <RadioGroupItem value="system" id="system" />
                <Monitor className="h-5 w-5 text-muted-foreground" />
                <Label htmlFor="system" className="flex-1 cursor-pointer">
                  <span className="font-medium">System</span>
                  <span className="block text-sm text-muted-foreground">Follow your device settings</span>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Settings;
