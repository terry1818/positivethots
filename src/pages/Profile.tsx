import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Flame, MessageCircle, User, LogOut, Settings } from "lucide-react";
import { toast } from "sonner";

const Profile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Signed out successfully");
      navigate("/auth");
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Profile</h1>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground"
          >
            <Settings className="h-6 w-6" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 container max-w-md mx-auto px-4 py-6">
        <Card className="overflow-hidden mb-6">
          <div className="relative h-64 bg-gradient-to-br from-primary to-secondary">
            <img
              src={profile?.profile_image}
              alt={profile?.name}
              className="absolute inset-0 w-full h-full object-cover opacity-90"
            />
          </div>
          <div className="p-6">
            <h2 className="text-3xl font-bold mb-2">
              {profile?.name}, {profile?.age}
            </h2>
            <p className="text-muted-foreground mb-4">{profile?.location}</p>
            {profile?.bio && (
              <p className="text-foreground">{profile.bio}</p>
            )}
          </div>
        </Card>

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start text-left"
            onClick={() => toast("Edit profile coming soon!")}
          >
            <Settings className="mr-2 h-5 w-5" />
            Edit Profile
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-left text-destructive hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="border-t border-border bg-card">
        <div className="container max-w-md mx-auto px-4 py-3 flex justify-around">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="text-muted-foreground"
          >
            <Flame className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/messages")}
            className="text-muted-foreground"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" className="text-primary">
            <User className="h-6 w-6" />
          </Button>
        </div>
      </nav>
    </div>
  );
};

export default Profile;
