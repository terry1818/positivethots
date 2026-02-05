 import { useEffect, useState, useCallback } from "react";
 import { toast } from "sonner";
 
 interface AntiCheatOptions {
   enabled: boolean;
   onViolation?: (type: string) => void;
 }
 
 export const useAntiCheat = ({ enabled, onViolation }: AntiCheatOptions) => {
   const [violations, setViolations] = useState<string[]>([]);
   const [isTabActive, setIsTabActive] = useState(true);
 
   const recordViolation = useCallback((type: string) => {
     setViolations(prev => [...prev, type]);
     onViolation?.(type);
     
     const messages: Record<string, string> = {
       "tab-switch": "Please stay on this tab during the quiz",
       "copy": "Copying is disabled during the quiz",
       "paste": "Pasting is disabled during the quiz",
       "cut": "Cutting is disabled during the quiz",
       "screenshot": "Screenshots are not allowed during the quiz",
       "context-menu": "Right-click is disabled during the quiz",
       "select": "Text selection is limited during the quiz",
     };
     
     toast.warning(messages[type] || "Please focus on the quiz", {
       duration: 3000,
     });
   }, [onViolation]);
 
   useEffect(() => {
     if (!enabled) return;
 
     // Prevent copy/cut/paste
     const handleCopy = (e: ClipboardEvent) => {
       e.preventDefault();
       recordViolation("copy");
     };
     
     const handleCut = (e: ClipboardEvent) => {
       e.preventDefault();
       recordViolation("cut");
     };
     
     const handlePaste = (e: ClipboardEvent) => {
       e.preventDefault();
       recordViolation("paste");
     };
 
     // Prevent context menu (right-click)
     const handleContextMenu = (e: MouseEvent) => {
       e.preventDefault();
       recordViolation("context-menu");
     };
 
     // Detect tab/window switching
     const handleVisibilityChange = () => {
       if (document.hidden) {
         setIsTabActive(false);
         recordViolation("tab-switch");
       } else {
         setIsTabActive(true);
       }
     };
 
     const handleBlur = () => {
       setIsTabActive(false);
       recordViolation("tab-switch");
     };
 
     const handleFocus = () => {
       setIsTabActive(true);
     };
 
     // Attempt to detect screenshot (PrintScreen key)
     const handleKeyDown = (e: KeyboardEvent) => {
       // PrintScreen key
       if (e.key === "PrintScreen") {
         e.preventDefault();
         recordViolation("screenshot");
       }
       // Prevent Ctrl+P (print)
       if (e.ctrlKey && e.key === "p") {
         e.preventDefault();
         recordViolation("screenshot");
       }
       // Prevent Ctrl+Shift+S (screenshot on some systems)
       if (e.ctrlKey && e.shiftKey && e.key === "s") {
         e.preventDefault();
         recordViolation("screenshot");
       }
       // Prevent Ctrl+C, Ctrl+X, Ctrl+V
       if (e.ctrlKey && (e.key === "c" || e.key === "x" || e.key === "v")) {
         e.preventDefault();
       }
       // Prevent Cmd+C, Cmd+X, Cmd+V on Mac
       if (e.metaKey && (e.key === "c" || e.key === "x" || e.key === "v")) {
         e.preventDefault();
       }
     };
 
     // Prevent text selection with CSS
     document.body.style.userSelect = "none";
     document.body.style.webkitUserSelect = "none";
 
     // Add event listeners
     document.addEventListener("copy", handleCopy);
     document.addEventListener("cut", handleCut);
     document.addEventListener("paste", handlePaste);
     document.addEventListener("contextmenu", handleContextMenu);
     document.addEventListener("visibilitychange", handleVisibilityChange);
     document.addEventListener("keydown", handleKeyDown);
     window.addEventListener("blur", handleBlur);
     window.addEventListener("focus", handleFocus);
 
     return () => {
       // Restore text selection
       document.body.style.userSelect = "";
       document.body.style.webkitUserSelect = "";
       
       // Remove event listeners
       document.removeEventListener("copy", handleCopy);
       document.removeEventListener("cut", handleCut);
       document.removeEventListener("paste", handlePaste);
       document.removeEventListener("contextmenu", handleContextMenu);
       document.removeEventListener("visibilitychange", handleVisibilityChange);
       document.removeEventListener("keydown", handleKeyDown);
       window.removeEventListener("blur", handleBlur);
       window.removeEventListener("focus", handleFocus);
     };
   }, [enabled, recordViolation]);
 
   return { violations, isTabActive, violationCount: violations.length };
 };