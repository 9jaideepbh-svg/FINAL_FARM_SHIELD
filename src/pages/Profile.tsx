import { useState } from "react";
import { getAuth, updateProfile } from "firebase/auth";
import app from "../firebase";
import { Layout } from "@/components/layout/Layout";
import { User as UserIcon, Mail, LogOut, Edit2, Check, X } from "lucide-react";
import { m } from "framer-motion";
import { useFirebaseAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const firebaseAuth = getAuth(app);

export default function Profile() {
  const { user, signOut } = useFirebaseAuth();
  const { toast } = useToast();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.displayName || "");
  const [savingName, setSavingName] = useState(false);

  if (!user) return null;

  const initials = (user.displayName || user.email || "F")
    .split(" ")
    .map(w => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSaveName = async () => {
    if (!newName.trim()) return;
    setSavingName(true);
    try {
      await updateProfile(user, { displayName: newName.trim() });
      // Force re-render by reloading
      await firebaseAuth.currentUser?.reload();
      toast({ title: "Name updated!", description: "Your display name has been saved." });
      setEditingName(false);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? "Failed to update name.", variant: "destructive" });
    } finally {
      setSavingName(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Signed out", description: "You have been signed out successfully." });
  };

  return (
    <Layout>
      <div className="relative min-h-[calc(100vh-8rem)] w-full py-8 md:py-12 px-4 overflow-hidden">
        <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-green-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="container max-w-2xl mx-auto relative z-10">
          {/* Header */}
          <m.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-semibold mb-3">
                <UserIcon className="h-3.5 w-3.5" />
                Account Management Center
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 via-emerald-800 to-emerald-950 bg-clip-text text-transparent">
                Farmer Profile
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Manage your credentials and account settings
              </p>
            </div>
          </m.div>

          {/* Profile Card */}
          <m.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full bg-white/40 border border-white/60 shadow-xl rounded-[28px] backdrop-blur-xl p-6 md:p-8 overflow-hidden"
          >
            {/* Avatar & basic info */}
            <div className="flex flex-col items-center gap-4 pb-6 border-b border-gray-100/70">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-24 h-24 rounded-full border-4 border-emerald-500/30 shadow-lg object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {initials}
                </div>
              )}

              {/* Display Name (editable) */}
              {editingName ? (
                <div className="flex items-center gap-2 w-full max-w-xs">
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="flex-1 bg-white/60 border border-emerald-300 rounded-xl px-4 py-2 text-sm text-gray-800 focus:border-emerald-500 outline-none transition-all"
                    placeholder="Enter your name"
                    autoFocus
                    onKeyDown={e => e.key === "Enter" && handleSaveName()}
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={savingName}
                    className="p-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => { setEditingName(false); setNewName(user.displayName || ""); }}
                    className="p-2 rounded-xl bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900">
                    {user.displayName || "Farmer"}
                  </h2>
                  <button
                    onClick={() => setEditingName(true)}
                    className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-700 transition-colors"
                    title="Edit name"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Email */}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Mail className="h-4 w-4 text-emerald-600" />
                <span>{user.email}</span>
                {user.emailVerified && (
                  <span className="ml-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                    Verified ✓
                  </span>
                )}
              </div>

              {/* Provider badge */}
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 font-medium">
                  {user.providerData?.[0]?.providerId === "google.com" ? "🔵 Google Account" : "📧 Email Account"}
                </span>
              </div>
            </div>

            {/* Account details */}
            <div className="py-6 border-b border-gray-100/70 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Account Information</h3>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-500">User ID</span>
                <span className="text-xs font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded-lg truncate max-w-[200px]">
                  {user.uid}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-500">Email Verified</span>
                <span className={`text-sm font-semibold ${user.emailVerified ? "text-emerald-600" : "text-amber-500"}`}>
                  {user.emailVerified ? "Yes ✓" : "No — check your inbox"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-500">Auth Provider</span>
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {user.providerData?.[0]?.providerId?.replace(".com", "") || "email"}
                </span>
              </div>
            </div>

            {/* Sign out */}
            <div className="pt-6">
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="w-full gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all rounded-xl"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </m.div>
        </div>
      </div>
    </Layout>
  );
}
