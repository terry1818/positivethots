import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link2, Loader2, Copy, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export const LinkedAccountsCard = () => {
  const { user } = useAuth();
  const [fetlifeLink, setFetlifeLink] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [linking, setLinking] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    loadLink();
  }, [user?.id]);

  const loadLink = async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase
        .from("external_platform_links" as any)
        .select("*")
        .eq("user_id", user.id)
        .eq("platform", "fetlife")
        .maybeSingle();
      setFetlifeLink(data);
    } catch (err) {
      console.error("Failed to load external link:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async () => {
    if (!username.trim()) {
      toast.error("Please enter your FetLife username");
      return;
    }
    setLinking(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-external-profile", {
        body: {
          action: "link",
          platform: "fetlife",
          platform_username: username.trim(),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setVerificationCode(data.verification_code);
      setFetlifeLink(data.link);
      toast.success("Verification code generated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to link profile");
    } finally {
      setLinking(false);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const code = verificationCode || fetlifeLink?.verification_code;
      const { data, error } = await supabase.functions.invoke("verify-external-profile", {
        body: {
          action: "verify",
          platform: "fetlife",
          verification_code: code,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setFetlifeLink(data.link);
      toast.success("FetLife profile linked! Badge added to your profile.");
    } catch (err: any) {
      toast.error(err.message || "Verification failed. Try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleUnlink = async () => {
    setUnlinking(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-external-profile", {
        body: { action: "unlink", platform: "fetlife" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setFetlifeLink(null);
      setUsername("");
      setVerificationCode("");
      toast.success("FetLife profile unlinked");
    } catch (err: any) {
      toast.error(err.message || "Failed to unlink");
    } finally {
      setUnlinking(false);
    }
  };

  const copyCode = () => {
    const code = verificationCode || fetlifeLink?.verification_code;
    if (code) {
      navigator.clipboard.writeText(code);
      setCodeCopied(true);
      toast.success("Code copied!");
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <Card className="animate-fade-in" style={{ animationDelay: "98ms" }}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Link2 className="h-5 w-5" /> External Platforms
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const isLinked = fetlifeLink?.status === "self_reported" || fetlifeLink?.status === "verified";
  const isPending = fetlifeLink?.status === "pending";

  return (
    <Card className="animate-fade-in" style={{ animationDelay: "98ms" }}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Link2 className="h-5 w-5" /> External Platforms
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* FetLife */}
        <div className="space-y-3 p-3 rounded-lg bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-[hsl(280,60%,50%)]" />
              <span className="text-sm font-medium">FetLife</span>
            </div>
            {isLinked && (
              <Badge
                variant={fetlifeLink.status === "verified" ? "default" : "secondary"}
                className="text-sm"
              >
                {fetlifeLink.status === "verified" ? "✓ Verified" : "Self-Reported"}
              </Badge>
            )}
          </div>

          {isLinked ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Linked as <span className="font-medium text-foreground">@{fetlifeLink.platform_username}</span>
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full min-h-[44px]"
                onClick={handleUnlink}
                disabled={unlinking}
              >
                {unlinking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <><Trash2 className="h-4 w-4 mr-2" /> Unlink FetLife</>
                )}
              </Button>
            </div>
          ) : isPending ? (
            <div className="space-y-3">
              <div className="p-3 rounded-md bg-primary/5 border border-primary/20">
                <p className="text-sm font-medium mb-1">Verification Code</p>
                <div className="flex items-center gap-2">
                  <code className="text-base font-mono font-bold text-primary flex-1">
                    {verificationCode || fetlifeLink.verification_code}
                  </code>
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={copyCode}>
                    {codeCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>1. Copy the code above</p>
                <p>2. Add it to your FetLife "About Me" section</p>
                <p>3. Tap "Verify" below</p>
              </div>
              <Button
                className="w-full min-h-[44px]"
                onClick={handleVerify}
                disabled={verifying}
              >
                {verifying ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                {verifying ? "Verifying…" : "I've Added the Code — Verify"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Link your FetLife profile to build trust and show community presence.
              </p>
              <Input
                placeholder="Your FetLife username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={50}
                className="min-h-[44px]"
              />
              <Button
                className="w-full min-h-[44px]"
                onClick={handleLink}
                disabled={linking || !username.trim()}
              >
                {linking ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Link2 className="h-4 w-4 mr-2" />
                )}
                {linking ? "Generating code…" : "Link FetLife Profile"}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
