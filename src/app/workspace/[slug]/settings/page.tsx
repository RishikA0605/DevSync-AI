"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, AlertTriangle } from "lucide-react";
import { signOut } from "next-auth/react";
import { deleteAccount } from "@/features/auth/actions/auth.actions";

export default function SettingsPage() {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data, including workspaces you own."
    );

    if (!confirmDelete) return;

    try {
      setIsDeleting(true);
      await deleteAccount();
      // Sign out and redirect to home/auth
      await signOut({ callbackUrl: "/auth" });
    } catch (error) {
      console.error(error);
      alert("Failed to delete account. Please try again.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
          <p className="text-zinc-400 mt-1">Manage your account preferences and data.</p>
        </div>

        <Card className="border-red-900/50 bg-red-950/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <CardTitle className="text-red-500">Danger Zone</CardTitle>
            </div>
            <CardDescription className="text-zinc-400">
              Permanently remove your account and all of its contents from the DevSync AI platform. This action is not reversible.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? "Deleting Account..." : "Delete My Account"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
