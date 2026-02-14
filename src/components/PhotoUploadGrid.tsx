import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Camera, Plus, Trash2, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

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

export const PhotoUploadGrid = ({ userId, photos, onPhotosChange }: PhotoUploadGridProps) => {
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("public");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const publicPhotos = photos.filter((p) => p.visibility === "public").sort((a, b) => a.order_index - b.order_index);
  const privatePhotos = photos.filter((p) => p.visibility === "private").sort((a, b) => a.order_index - b.order_index);
  const currentPhotos = activeTab === "public" ? publicPhotos : privatePhotos;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (currentPhotos.length >= MAX_PHOTOS) {
      toast.error(`Maximum ${MAX_PHOTOS} ${activeTab} photos allowed`);
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/${activeTab}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("user-photos")
        .upload(path, file);
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

      // Trigger moderation
      supabase.functions.invoke("moderate-photo", {
        body: { photo_id: photoRecord.id, mode: "moderation" },
      }).then(() => {
        // Refresh after moderation completes
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
            className="relative aspect-square rounded-lg overflow-hidden border border-border bg-muted/30"
          >
            {photo ? (
              <>
                <img
                  src={photo.photo_url}
                  alt={`Photo ${i + 1}`}
                  className={`w-full h-full object-cover ${photo.moderation_status === "rejected" ? "opacity-40" : ""}`}
                />
                {/* Status badge */}
                <div className={`absolute top-1 left-1 rounded-full p-0.5 text-white ${statusColor(photo.moderation_status)}`}>
                  {statusIcon(photo.moderation_status)}
                </div>
                {/* Delete button */}
                <button
                  onClick={() => handleDelete(photo)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
                {/* Rejection reason tooltip */}
                {photo.moderation_status === "rejected" && photo.moderation_reason && (
                  <div className="absolute bottom-0 left-0 right-0 bg-destructive/90 text-destructive-foreground text-[10px] px-1 py-0.5 truncate">
                    {photo.moderation_reason}
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
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
            <p className="text-xs text-muted-foreground mb-2">Visible to everyone. First photo is your main profile image.</p>
            {renderGrid(publicPhotos)}
          </TabsContent>
          <TabsContent value="private">
            <p className="text-xs text-muted-foreground mb-2">Only shared with your matches.</p>
            {renderGrid(privatePhotos)}
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
