import { useEffect, useState } from "react";
import { useBlocker } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UnsavedChangesPromptProps {
  hasChanges: boolean;
  saving: boolean;
  onSave: () => Promise<void> | void;
}

/**
 * Blocks in-app navigation when the user has unsaved profile edits and
 * surfaces a "Save or discard?" confirmation. Also warns on tab close.
 */
export const UnsavedChangesPrompt = ({ hasChanges, saving, onSave }: UnsavedChangesPromptProps) => {
  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    hasChanges && !saving && currentLocation.pathname !== nextLocation.pathname
  );
  const [open, setOpen] = useState(false);

  // Open the dialog whenever the blocker actually engages
  useEffect(() => {
    if (blocker.state === "blocked") setOpen(true);
  }, [blocker.state]);

  // Native browser warning on tab/window close
  useEffect(() => {
    if (!hasChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasChanges]);

  const handleDiscard = () => {
    setOpen(false);
    if (blocker.state === "blocked") blocker.proceed();
  };

  const handleSave = async () => {
    try {
      await onSave();
      setOpen(false);
      // After a successful save, hasChanges becomes false; let the blocker
      // proceed so the user reaches their intended destination.
      if (blocker.state === "blocked") blocker.proceed();
    } catch {
      // If save fails, keep the dialog open so the user can retry or discard
    }
  };

  const handleCancel = () => {
    setOpen(false);
    if (blocker.state === "blocked") blocker.reset();
  };

  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) handleCancel(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>You have unsaved changes</AlertDialogTitle>
          <AlertDialogDescription>Save or discard?</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleDiscard}>Discard</AlertDialogCancel>
          <AlertDialogAction onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
