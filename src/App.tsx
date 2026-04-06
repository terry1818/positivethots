import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CookieConsent } from "@/components/CookieConsent";
import { PageLoader } from "@/components/PageLoader";
import { PageSkeleton } from "@/components/PageSkeleton";
import { OfflineBanner } from "@/components/OfflineBanner";
import { useCartSync } from "@/hooks/useCartSync";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { WelcomeBackModal } from "@/components/WelcomeBackModal";
import { useNPSSurvey } from "@/hooks/useNPSSurvey";
import { NpsModal } from "@/components/NpsModal";
import { DailyRewardModal } from "@/components/rewards/DailyRewardModal";
import { AppFooter } from "@/components/AppFooter";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { WelcomeBackBanner } from "@/components/WelcomeBackBanner";

// Lazy-loaded route pages
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Learn = lazy(() => import("./pages/Learn"));
const LearnModule = lazy(() => import("./pages/LearnModule"));
const Messages = lazy(() => import("./pages/Messages"));
const Chat = lazy(() => import("./pages/Chat"));
const Profile = lazy(() => import("./pages/Profile"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const Settings = lazy(() => import("./pages/Settings"));
const LikesYou = lazy(() => import("./pages/LikesYou"));
const Premium = lazy(() => import("./pages/Premium"));
const Wallet = lazy(() => import("./pages/Wallet"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
// Shop is now an external link — no in-app route needed
const Resources = lazy(() => import("./pages/Resources"));
const Events = lazy(() => import("./pages/Events"));
const LearningJournal = lazy(() => import("./pages/LearningJournal"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const NotFound = lazy(() => import("./pages/NotFound"));
const CommunityGuidelines = lazy(() => import("./pages/CommunityGuidelines"));
const CelebrationDemo = lazy(() => import("./pages/CelebrationDemo"));
const TestingLocator = lazy(() => import("./pages/TestingLocator"));
const HealthTesting = lazy(() => import("./pages/HealthTesting"));
const ContentCompliance = lazy(() => import("./pages/ContentCompliance"));
const Admin = lazy(() => import("./pages/Admin"));

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 min default
      gcTime: 10 * 60 * 1000,         // 10 min cache lifetime
      refetchOnWindowFocus: false,
      retry: 1,
      retryDelay: 1000,
      networkMode: 'offlineFirst',
    },
  },
});

const AppContent = () => {
  useCartSync();
  const { previousChurnStatus } = useActivityTracker();
  const { pendingTrigger, dismiss } = useNPSSurvey();

  // Apply text scale on mount (load from DB via user preferences)
  useEffect(() => {
    // Default to medium; the Settings page will update when preferences load
    document.documentElement.classList.remove("text-scale-small", "text-scale-medium", "text-scale-large");
    document.documentElement.classList.add("text-scale-medium");
  }, []);

  return (
    <>
      <OfflineBanner />
      <AnnouncementBanner />
      <WelcomeBackBanner />
      <DailyRewardModal />
      <WelcomeBackModal previousChurnStatus={previousChurnStatus} />
      {pendingTrigger && <NpsModal triggerEvent={pendingTrigger} onClose={dismiss} />}
      <Routes>
        <Route path="/" element={<Suspense fallback={<PageSkeleton variant="discovery" />}><Index /></Suspense>} />
        <Route path="/auth" element={<Suspense fallback={<PageLoader />}><Auth /></Suspense>} />
        <Route path="/reset-password" element={<Suspense fallback={<PageLoader />}><ResetPassword /></Suspense>} />
        <Route path="/onboarding" element={<Suspense fallback={<PageLoader />}><Onboarding /></Suspense>} />
        <Route path="/likes" element={<Suspense fallback={<PageSkeleton variant="likes" />}><LikesYou /></Suspense>} />
        <Route path="/premium" element={<Suspense fallback={<PageLoader />}><Premium /></Suspense>} />
        <Route path="/wallet" element={<Suspense fallback={<PageLoader />}><Wallet /></Suspense>} />
        <Route path="/learn" element={<Suspense fallback={<PageSkeleton variant="learn" />}><Learn /></Suspense>} />
        <Route path="/learn/:slug" element={<Suspense fallback={<PageSkeleton variant="learn" />}><LearnModule /></Suspense>} />
        <Route path="/messages" element={<Suspense fallback={<PageSkeleton variant="messages" />}><Messages /></Suspense>} />
        <Route path="/chat/:matchId" element={<Suspense fallback={<PageSkeleton variant="chat" />}><Chat /></Suspense>} />
        <Route path="/profile" element={<Suspense fallback={<PageSkeleton variant="profile" />}><Profile /></Suspense>} />
        <Route path="/profile/edit" element={<Suspense fallback={<PageSkeleton variant="profile" />}><EditProfile /></Suspense>} />
        <Route path="/settings" element={<Suspense fallback={<PageLoader />}><Settings /></Suspense>} />
        {/* Shop is now an external link to positivethots.store */}
        <Route path="/resources" element={<Suspense fallback={<PageLoader />}><Resources /></Suspense>} />
        <Route path="/events" element={<Suspense fallback={<PageLoader />}><Events /></Suspense>} />
        <Route path="/journal" element={<Suspense fallback={<PageLoader />}><LearningJournal /></Suspense>} />
        <Route path="/unsubscribe" element={<Suspense fallback={<PageLoader />}><Unsubscribe /></Suspense>} />
        <Route path="/privacy" element={<Suspense fallback={<PageLoader />}><PrivacyPolicy /></Suspense>} />
        <Route path="/terms" element={<Suspense fallback={<PageLoader />}><TermsOfService /></Suspense>} />
        <Route path="/community-guidelines" element={<Suspense fallback={<PageLoader />}><CommunityGuidelines /></Suspense>} />
        <Route path="/testing-locations" element={<Suspense fallback={<PageLoader />}><TestingLocator /></Suspense>} />
        <Route path="/health-testing" element={<Suspense fallback={<PageLoader />}><HealthTesting /></Suspense>} />
        <Route path="/celebration-demo" element={<Suspense fallback={<PageLoader />}><CelebrationDemo /></Suspense>} />
        <Route path="/2257" element={<Suspense fallback={<PageLoader />}><ContentCompliance /></Suspense>} />
        <Route path="/admin" element={<Suspense fallback={<PageLoader />}><Admin /></Suspense>} />
        <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFound /></Suspense>} />
      </Routes>
      <AppFooter />
    </>
  );
};

const App = () => (
  <ErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
            <CookieConsent />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
