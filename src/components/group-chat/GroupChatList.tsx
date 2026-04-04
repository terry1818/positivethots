import { useState } from "react";
import { useGroupChats, type GroupChat } from "@/hooks/useGroupChats";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BrandedEmptyState } from "@/components/BrandedEmptyState";
import { Users, Plus } from "lucide-react";
import { CreateGroupChat } from "./CreateGroupChat";
import { cn } from "@/lib/utils";

interface GroupChatListProps {
  onSelectGroup: (groupId: string) => void;
}

export const GroupChatList = ({ onSelectGroup }: GroupChatListProps) => {
  const { groups, isLoading } = useGroupChats();
  const [showCreate, setShowCreate] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-3 px-4">
        {[1, 2].map(i => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-4">
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
          <Users className="h-4 w-4" /> Group Chats
        </h3>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowCreate(true)} aria-label="Create group chat">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {groups.length === 0 ? (
        <div className="px-4 py-3">
          <p className="text-xs text-muted-foreground text-center">
            No group chats yet. Create one with your matches!
          </p>
        </div>
      ) : (
        groups.map(group => (
          <button
            key={group.id}
            type="button"
            onClick={() => onSelectGroup(group.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            )}
          >
            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
              <AvatarFallback className="bg-primary/20 text-primary font-bold">
                {group.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{group.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {group.last_message?.content || "No messages yet"}
              </p>
            </div>
          </button>
        ))
      )}

      <CreateGroupChat open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
};
