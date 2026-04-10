import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserPlus, Copy, Check, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

function generatePassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  let pw = "";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    pw += chars[array[i] % chars.length];
  }
  return pw;
}

export const DemoAccountButton = ({ onRefresh }: { onRefresh?: () => void }) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("demo@positivethots.app");
  const [password, setPassword] = useState(() => generatePassword());
  const [displayName, setDisplayName] = useState("Demo User");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleOpen = () => {
    setEmail("demo@positivethots.app");
    setPassword(generatePassword());
    setDisplayName("Demo User");
    setCreated(false);
    setOpen(true);
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-demo-account", {
        body: { email, password, displayName },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Demo account created!");
      setCreated(true);
      onRefresh?.();
    } catch (e: any) {
      toast.error(e.message || "Failed to create demo account");
    }
    setLoading(false);
  };

  const handleCopyAll = () => {
    copyToClipboard(`Email: ${email}\nPassword: ${password}`, "all");
  };

  return (
    <>
      <Button onClick={handleOpen} className="min-h-[44px] gap-2 bg-primary hover:bg-primary/90">
        <UserPlus className="h-4 w-4" />
        Create Demo Account
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{created ? "Demo Account Ready" : "Create Demo Account"}</DialogTitle>
            <DialogDescription>
              {created
                ? "Copy these credentials to share with the review team."
                : "This will create a fully configured VIP account with completed Foundation badges, a filled profile, and full app access."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email</label>
              <div className="flex gap-2">
                <Input value={email} onChange={e => setEmail(e.target.value)} disabled={created} />
                {created && (
                  <Button size="icon" variant="outline" className="min-h-[44px] min-w-[44px] shrink-0"
                    onClick={() => copyToClipboard(email, "email")} aria-label="Copy email">
                    {copiedField === "email" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Password</label>
              <div className="flex gap-2">
                <Input value={password} onChange={e => setPassword(e.target.value)} disabled={created} />
                <Button size="icon" variant="outline" className="min-h-[44px] min-w-[44px] shrink-0"
                  onClick={() => copyToClipboard(password, "password")} aria-label="Copy password">
                  {copiedField === "password" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Display Name</label>
              <Input value={displayName} onChange={e => setDisplayName(e.target.value)} disabled={created} />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {created ? (
              <Button onClick={handleCopyAll} className="min-h-[44px] w-full gap-2 bg-primary hover:bg-primary/90">
                {copiedField === "all" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedField === "all" ? "Copied!" : "Copy All Credentials"}
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setOpen(false)} className="min-h-[44px]">Cancel</Button>
                <Button onClick={handleCreate} disabled={loading || !email || !password}
                  className="min-h-[44px] gap-2 bg-primary hover:bg-primary/90">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Create Account
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Badge component for the user table
export const DemoBadge = () => (
  <Badge className="text-[10px] px-1.5 bg-amber-600 text-amber-50">DEMO</Badge>
);

// Delete demo account button
export const DeleteDemoButton = ({
  userId,
  userName,
  onDeleted,
}: {
  userId: string;
  userName: string;
  onDeleted?: () => void;
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-demo-account", {
        body: { action: "delete", userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Demo account ${userName} deleted`);
      setConfirmOpen(false);
      onDeleted?.();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete demo account");
    }
    setLoading(false);
  };

  return (
    <>
      <Button size="icon" variant="destructive" className="min-h-[44px] min-w-[44px]"
        onClick={() => setConfirmOpen(true)} aria-label={`Delete demo account ${userName}`}>
        <Trash2 className="h-4 w-4" />
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete demo account?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete {userName}'s demo account? This is permanent and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading}
              className="min-h-[44px] bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
