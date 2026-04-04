import { useState } from "react";
import { useCrossAppLinks, SUPPORTED_PLATFORMS, buildUrl, type CrossAppLink } from "@/hooks/useCrossAppLinks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Globe, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export const CrossAppLinksEditor = () => {
  const { links, isLoading, updateLinks } = useCrossAppLinks();
  const [editLinks, setEditLinks] = useState<CrossAppLink[] | null>(null);
  const [saving, setSaving] = useState(false);

  const currentLinks = editLinks ?? links;

  const addLink = () => {
    if (currentLinks.length >= 5) {
      toast.error("Maximum 5 links allowed");
      return;
    }
    const usedPlatforms = currentLinks.map(l => l.platform);
    const available = SUPPORTED_PLATFORMS.filter(p => !usedPlatforms.includes(p.id));
    if (available.length === 0) return;

    setEditLinks([...currentLinks, {
      platform: available[0].id,
      username: "",
      url: "",
      verified: false,
    }]);
  };

  const updateLink = (index: number, field: keyof CrossAppLink, value: string) => {
    const updated = [...currentLinks];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "username" || field === "platform") {
      updated[index].url = buildUrl(updated[index].platform, updated[index].username);
    }
    setEditLinks(updated);
  };

  const removeLink = (index: number) => {
    setEditLinks(currentLinks.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!editLinks) return;
    const valid = editLinks.filter(l => l.username.trim());
    setSaving(true);
    try {
      await updateLinks.mutateAsync(valid);
      setEditLinks(null);
      toast.success("Links updated!");
    } catch {
      toast.error("Failed to save links");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="animate-fade-in">
        <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
        <CardContent><Skeleton className="h-20 w-full" /></CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Profile Links
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">Show how you roll on other platforms</p>

        {currentLinks.map((link, idx) => {
          const platform = SUPPORTED_PLATFORMS.find(p => p.id === link.platform);
          return (
            <div key={idx} className="flex items-start gap-2 p-3 rounded-lg border border-border bg-muted/20">
              <div className="flex-1 space-y-2">
                <Select
                  value={link.platform}
                  onValueChange={(val) => updateLink(idx, "platform", val)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_PLATFORMS.map(p => (
                      <SelectItem key={p.id} value={p.id} disabled={currentLinks.some((l, i) => i !== idx && l.platform === p.id)}>
                        <span className="flex items-center gap-2">
                          <span>{p.icon}</span>
                          <span>{p.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={link.username}
                  onChange={(e) => updateLink(idx, "username", e.target.value)}
                  placeholder={link.platform === "website" ? "https://yoursite.com" : "username"}
                  maxLength={100}
                />
                {link.username && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    {buildUrl(link.platform, link.username)}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeLink(idx)}
                aria-label="Remove link"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}

        {currentLinks.length < 5 && (
          <Button variant="outline" size="sm" onClick={addLink} className="w-full">
            <Plus className="h-4 w-4 mr-1" /> Add Link
          </Button>
        )}

        {editLinks && (
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Save Links
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
