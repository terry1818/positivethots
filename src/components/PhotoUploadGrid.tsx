import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Camera, Plus, Trash2, Clock, CheckCircle, XCircle, Loader2, Users, Star, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { isNative, pickNativePhoto } from "@/lib/capacitor";

interface UserPhoto {
  id: string;
  user_id: string;
  storage_path: string;
  photo_url: string;
  visibility: string;
  order_index: number;
  moderation_status: string;
  moderation_reason: string | null;
  created_at: string;
}

interface PhotoUploadGridProps {
  userId: string;
  photos: UserPhoto[];
  onPhotosChange: () => void;
}

const MAX_PHOTOS = 8;

interface MatchProfile { id: string; name: string; profile_image: string | null; }
interface PhotoAccess { grantee_id: string; revoked_at: string | null; }

const PrivatePhotoAccessManager = ({ userId }: { userId: string }) => {
  const [matches, setMatches] = useState<MatchProfile[]>([]);
  const [accessMap, setAccessMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    // Fetch matches
    const { data: matchRows } = await supabase
      .from("matches")
      .select("id, user1_id, user2_id")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    if (matchRows && matchRows.length > 0) {
      const partnerIds = matchRows.map(m => m.user1_id === userId ? m.user2_id : m.user1_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, profile_image")
        .in("id", partnerIds);
      setMatches(profiles || []);
    }

    // Fetch access grants
    const { data: grants } = await supabase
      .from("private_photo_access")
      .select("grantee_id, revoked_at")
      .eq("granter_id", userId);

    const map: Record<string, boolean> = {};
    grants?.forEach((g: any) => { map[g.grantee_id] = !g.revoked_at; });
    setAccessMap(map);
    setLoading(false);
  };

  const toggleAccess = async (granteeId: string, granted: boolean) => {
    if (granted) {
      await supabase.from("private_photo_access").upsert(
        { granter_id: userId, grantee_id: granteeId, granted_at: new Date().toISOString(), revoked_at: null },
        { onConflict: "granter_id,grantee_id" }
      );
    } else {
      await supabase.from("private_photo_access")
        .update({ revoked_at: new Date().toISOString() })
        .eq("granter_id", userId)
        .eq("grantee_id", granteeId);
    }
    setAccessMap(prev => ({ ...prev, [granteeId]: granted }));
  };

  return (
    <Sheet onOpenChange={(open) => { if (open) loadData(); }}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="w-full mt-3 gap-2">
          <Users className="h-4 w-4" /> Manage Access
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[70vh]">
        <SheetHeader>
          <SheetTitle>Private Photo Access</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
          ) : matches.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No matches yet. Match with someone to share private photos.</p>
          ) : (
            matches.map(match => (
              <div key={match.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
                    {match.profile_image ? (
                      <img src={match.profile_image} alt={match.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-sm font-medium">{match.name?.[0]}</div>
                    )}
                  </div>
                  <span className="text-sm font-medium truncate">{match.name}</span>
                </div>
                <Switch
                  checked={!!accessMap[match.id]}
                  onCheckedChange={(checked) => toggleAccess(match.id, checked)}
                />
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
export const PhotoUploadGrid = ({ userId, photos, onPhotosChange }: PhotoUploadGridProps) => {
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("public");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [photoStats, setPhotoStats] = useState<Record<string, { score: number; impressions: number }>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const publicPhotos = photos.filter((p) => p.visibility === "public").sort((a, b) => a.order_index - b.order_index);
  const privatePhotos = photos.filter((p) => p.visibility === "private").sort((a, b) => a.order_index - b.order_index);
  const currentPhotos = activeTab === "public" ? publicPhotos : privatePhotos;

  // Load photo performance stats
  useEffect(() => {
    const loadStats = async () => {
      const photoIds = photos.filter(p => p.visibility === "public" && p.moderation_status === "approved").map(p => p.id);
      if (photoIds.length === 0) return;
      const { data } = await supabase
        .from("photo_performance")
        .select("photo_id, score, impressions")
        .in("photo_id", photoIds);
      if (data) {
        const stats: Record<string, { score: number; impressions: number }> = {};
        data.forEach(row => {
          const existing = stats[row.photo_id];
          if (existing) {
            existing.score += Number(row.score);
            existing.impressions += row.impressions;
          } else {
            stats[row.photo_id] = { score: Number(row.score), impressions: row.impressions };
          }
        });
        setPhotoStats(stats);
      }
    };
    loadStats();
  }, [photos]);

  const bestPhotoId = Object.entries(photoStats).reduce<string | null>((best, [id, s]) => {
    if (s.impressions < 5) return best;
    if (!best) return id;
    return s.score > (photoStats[best]?.score || 0) ? id : best;
  }, null);

  const handleUpload = async (e?: React.ChangeEvent<HTMLInputElement>) => {
    if (currentPhotos.length >= MAX_PHOTOS) {
      toast.error(`Maximum ${MAX_PHOTOS} ${activeTab} photos allowed`);
      return;
    }

    setUploading(true);
    try {
      let blob: Blob | null = null;
      let ext = "jpg";

      // Try native camera/gallery first
      if (isNative()) {
        blob = await pickNativePhoto();
        if (!blob) {
          setUploading(false);
          return;
        }
      } else {
        // Web file input
        const file = e?.target?.files?.[0];
        if (!file) {
          setUploading(false);
          return;
        }
        if (!file.type.startsWith("image/")) {
          toast.error("Please select an image file");
          setUploading(false);
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error("Image must be under 5MB");
          setUploading(false);
          return;
        }
        blob = file;
        ext = file.name.split(".").pop() || "jpg";
      }

      const path = `${userId}/${activeTab}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("user-photos")
        .upload(path, blob);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("user-photos")
        .getPublicUrl(path);

      const { data: photoRecord, error: insertError } = await supabase
        .from("user_photos")
        .insert({
          user_id: userId,
          storage_path: path,
          photo_url: urlData.publicUrl,
          visibility: activeTab,
          order_index: currentPhotos.length,
          moderation_status: "pending",
        })
        .select()
        .single();
      if (insertError) throw insertError;

      supabase.functions.invoke("moderate-photo", {
        body: { photo_id: photoRecord.id, mode: "moderation" },
      }).then(() => {
        onPhotosChange();
      });

      toast.success("Photo uploaded! Moderation in progress...");
      onPhotosChange();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddPhoto = () => {
    if (isNative()) {
      handleUpload();
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleDelete = async (photo: UserPhoto) => {
    try {
      await supabase.storage.from("user-photos").remove([photo.storage_path]);
      await supabase.from("user_photos").delete().eq("id", photo.id);
      toast.success("Photo deleted");
      onPhotosChange();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete photo");
    }
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      return;
    }

    const list = [...currentPhotos];
    const draggedPhoto = list[dragIndex];
    if (!draggedPhoto || !list[dropIndex]) {
      setDragIndex(null);
      return;
    }

    // Reorder: remove dragged item and insert at drop position
    list.splice(dragIndex, 1);
    list.splice(dropIndex, 0, draggedPhoto);

    setDragIndex(null);

    // Batch update order_index and profile image
    try {
      const updates = list.map((photo, i) => 
        supabase.from("user_photos").update({ order_index: i }).eq("id", photo.id)
      );
      await Promise.all(updates);

      // Update profile image to the new first public approved photo
      if (activeTab === "public" && list[0]?.moderation_status === "approved") {
        await supabase.from("profiles").update({ profile_image: list[0].photo_url }).eq("id", userId);
      }

      onPhotosChange();
    } catch (error) {
      console.error("Reorder error:", error);
      toast.error("Failed to reorder photos");
    }
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-3.5 w-3.5" />;
      case "approved": return <CheckCircle className="h-3.5 w-3.5" />;
      case "rejected": return <XCircle className="h-3.5 w-3.5" />;
      default: return null;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500/80";
      case "approved": return "bg-green-500/80";
      case "rejected": return "bg-destructive/80";
      default: return "bg-muted";
    }
  };

  const renderGrid = (photoList: UserPhoto[]) => {
    const slots = Array.from({ length: MAX_PHOTOS }, (_, i) => photoList[i] || null);
    return (
      <div className="grid grid-cols-4 gap-2">
        {slots.map((photo, i) => (
          <div
            key={photo?.id || `empty-${i}`}
            className={`relative aspect-square rounded-lg overflow-hidden border bg-muted/30 transition-all ${
              dragOverIndex === i && photo ? "border-primary border-2 scale-105" : "border-border"
            } ${dragIndex === i ? "opacity-40" : ""}`}
            draggable={!!photo}
            onDragStart={() => photo && handleDragStart(i)}
            onDragOver={(e) => photo && handleDragOver(e, i)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => photo && handleDrop(e, i)}
            onDragEnd={handleDragEnd}
          >
            {photo ? (
              <>
                {photo.moderation_status === "pending" ? (
                  <div className="w-full h-full relative">
                    <img src={photo.photo_url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover blur-lg" draggable={false} />
                    <div className="absolute inset-0 bg-background/60 flex flex-col items-center justify-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground font-medium">Under review</span>
                    </div>
                  </div>
                ) : (
                  <img src={photo.photo_url} alt={`Photo ${i + 1}`} className={`w-full h-full object-cover ${photo.moderation_status === "rejected" ? "opacity-40" : ""}`} draggable={false} />
                )}
                <div className={`absolute top-1 left-1 rounded-full p-0.5 text-white ${statusColor(photo.moderation_status)}`}>
                  {statusIcon(photo.moderation_status)}
                </div>
                <button onClick={() => handleDelete(photo)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80 transition-colors">
                  <Trash2 className="h-3 w-3" />
                </button>
                {photo.moderation_status === "rejected" && photo.moderation_reason && (
                  <div className="absolute bottom-0 left-0 right-0 bg-destructive/90 text-destructive-foreground text-[10px] px-1 py-0.5 truncate">
                    {photo.moderation_reason}
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={handleAddPhoto}
                disabled={uploading}
                className="w-full h-full flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Plus className="h-5 w-5" />
                )}
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Photos
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {currentPhotos.length}/{MAX_PHOTOS}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-3">
            <TabsTrigger value="public" className="flex-1">Public</TabsTrigger>
            <TabsTrigger value="private" className="flex-1">Private</TabsTrigger>
          </TabsList>
          <TabsContent value="public">
            <p className="text-xs text-muted-foreground mb-2">Visible to everyone. First photo is your main profile image. Drag to reorder.</p>
            {renderGrid(publicPhotos)}
          </TabsContent>
          <TabsContent value="private">
            <p className="text-xs text-muted-foreground mb-2">Private photos are not shared by default. You control who can see them.</p>
            {renderGrid(privatePhotos)}
            <PrivatePhotoAccessManager userId={userId} />
          </TabsContent>
        </Tabs>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
      </CardContent>
    </Card>
  );
};
