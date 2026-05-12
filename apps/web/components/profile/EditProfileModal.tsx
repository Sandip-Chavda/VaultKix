"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, AlertCircle } from "lucide-react";
import { authService } from "@/lib/api/auth.service";
import { uploadService } from "@/lib/api/upload.service";
import { useAuthStore } from "@/stores/auth.store";
import { getErrorMessage, getInitials } from "@/lib/utils";
import type { SafeUser } from "@vaultkix/types";

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  user: SafeUser;
}

export function EditProfileModal({
  open,
  onClose,
  user,
}: EditProfileModalProps) {
  const { setUser } = useAuthStore();
  const [username, setUsername] = useState(user.username);
  const [avatar, setAvatar] = useState(user.avatar);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      startTransition(() => {
        setUsername(user.username);
        setAvatar(user.avatar);
        setError(null);
      });
    }
  }, [open, user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const result = await uploadService.uploadSingle(file, "vaultkix/avatars");
      setAvatar(result.url);
    } catch (err) {
      setError(getErrorMessage(err));
    }
    setUploadingAvatar(false);
  };

  const handleSubmit = async () => {
    if (!username.trim()) {
      setError("Username is required");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const updatedUser = await authService.updateProfile({ username, avatar });
      setUser(updatedUser);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-destructive/20 text-destructive text-sm px-3 py-2 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarImage src={avatar} />
                <AvatarFallback className="bg-primary text-white text-xl font-bold">
                  {getInitials(username)}
                </AvatarFallback>
              </Avatar>
              <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                <Upload className="w-3.5 h-3.5 text-white" />
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                />
              </label>
            </div>
            {uploadingAvatar && (
              <p className="text-xs text-muted-foreground">Uploading...</p>
            )}
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <Label>Username</Label>
            <Input
              value={username}
              onChange={(e) => {
                setError(null);
                setUsername(e.target.value);
              }}
              placeholder="Your username"
            />
          </div>

          {/* Email — read only */}
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user.email} disabled className="bg-section" />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90 text-white"
              onClick={handleSubmit}
              disabled={isLoading || uploadingAvatar}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
