"use client";

import { useState } from "react";
import { MapPin, Plus, Trash2, Star, Pencil } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WalletCard } from "@/components/profile/WalletCard";
import { UserStatsGrid } from "@/components/profile/UserStatsGrid";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { AddressFormModal } from "@/components/profile/AddressFormModal";
import { useAuthStore } from "@/stores/auth.store";
import { authService } from "@/lib/api/auth.service";
import { getErrorMessage, getInitials, formatDate } from "@/lib/utils";
import type { IAddress } from "@vaultkix/types";

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [editOpen, setEditOpen] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  if (!user) return null;

  const handleDeleteAddress = async (addressId: string) => {
    setDeletingId(addressId);
    try {
      const updated = await authService.deleteAddress(addressId);
      setUser(updated);
    } catch (err) {
      console.error(getErrorMessage(err));
    }
    setDeletingId(null);
  };

  const handleSetDefault = async (addressId: string) => {
    setSettingDefaultId(addressId);
    try {
      const updated = await authService.setDefaultAddress(addressId);
      setUser(updated);
    } catch (err) {
      console.error(getErrorMessage(err));
    }
    setSettingDefaultId(null);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* ── Profile Header ── */}
      <div className="bg-background rounded-2xl border border-border p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 ring-2 ring-primary/20">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-primary text-white text-xl font-bold">
                {getInitials(user.username)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold text-dark">{user.username}</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge className="bg-primary-light text-primary capitalize border-primary/20">
                  {user.role}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Joined {formatDate(user.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 shrink-0"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </Button>
        </div>
      </div>

      {/* ── Wallet ── */}
      <WalletCard wallet={user.wallet} />

      {/* ── Activity Stats ── */}
      <UserStatsGrid stats={user.stats} />

      {/* ── Addresses ── */}
      <div className="bg-background rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-dark">Addresses</h2>
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90 text-white gap-1.5"
            onClick={() => setAddressOpen(true)}
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </Button>
        </div>

        {user.addresses.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No addresses yet</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add one for delivery orders
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {user.addresses.map((address: IAddress) => (
              <div
                key={address._id}
                className={`rounded-xl border p-3 transition-colors ${
                  address.isDefault
                    ? "border-primary bg-primary-light"
                    : "border-border bg-section"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin
                      className={`w-4 h-4 shrink-0 ${
                        address.isDefault
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-dark text-sm">
                          {address.label}
                        </p>
                        {address.isDefault && (
                          <Badge className="bg-primary text-white text-[10px] px-1.5 py-0">
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {address.street}, {address.city}, {address.zip},{" "}
                        {address.country}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!address.isDefault && (
                      <button
                        onClick={() =>
                          address._id && handleSetDefault(address._id)
                        }
                        disabled={settingDefaultId === address._id}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-primary/10 transition-colors"
                        title="Set as default"
                      >
                        <Star className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    )}
                    <button
                      onClick={() =>
                        address._id && handleDeleteAddress(address._id)
                      }
                      disabled={deletingId === address._id}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <EditProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        user={user}
      />
      <AddressFormModal
        open={addressOpen}
        onClose={() => setAddressOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}
