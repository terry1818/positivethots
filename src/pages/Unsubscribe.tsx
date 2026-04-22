import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { Loader2, CheckCircle, XCircle, MailX } from "lucide-react";

type Status = "loading" | "valid" | "already" | "invalid" | "success" | "error";

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    const validate = async () => {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${token}`;
        const res = await fetch(url, {
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        });
        const data = await res.json();
        if (!res.ok) {
          setStatus("invalid");
        } else if (data.valid === false && data.reason === "already_unsubscribed") {
          setStatus("already");
        } else if (data.valid) {
          setStatus("valid");
        } else {
          setStatus("invalid");
        }
      } catch {
        setStatus("invalid");
      }
    };
    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      if (data?.success) {
        setStatus("success");
      } else if (data?.reason === "already_unsubscribed") {
        setStatus("already");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <Logo size="lg" />
      <Card className="mt-8 w-full max-w-md">
        <CardContent className="pt-6 text-center space-y-4">
          {status === "loading" && (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Validating your request…</p>
            </>
          )}
          {status === "valid" && (
            <>
              <MailX className="h-10 w-10 text-muted-foreground mx-auto" />
              <h2 className="text-xl font-bold">Unsubscribe from emails?</h2>
              <p className="text-sm text-muted-foreground">
                You'll stop receiving app notification emails from Positive Thots<sup className="text-[0.5em] ml-0.5 align-super">TM</sup>.
              </p>
              <Button onClick={handleUnsubscribe} disabled={processing} className="w-full">
                {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirm Unsubscribe
              </Button>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle className="h-10 w-10 text-primary mx-auto" />
              <h2 className="text-xl font-bold">You've been unsubscribed</h2>
              <p className="text-sm text-muted-foreground">
                You won't receive any more app notification emails.
              </p>
            </>
          )}
          {status === "already" && (
            <>
              <CheckCircle className="h-10 w-10 text-muted-foreground mx-auto" />
              <h2 className="text-xl font-bold">Already unsubscribed</h2>
              <p className="text-sm text-muted-foreground">
                You've already been removed from our mailing list.
              </p>
            </>
          )}
          {(status === "invalid" || status === "error") && (
            <>
              <XCircle className="h-10 w-10 text-destructive mx-auto" />
              <h2 className="text-xl font-bold">Invalid link</h2>
              <p className="text-sm text-muted-foreground">
                This unsubscribe link is invalid or has expired.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Unsubscribe;
