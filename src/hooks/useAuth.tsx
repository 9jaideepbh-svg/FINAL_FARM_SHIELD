import { useUser, useClerk } from "@clerk/clerk-react";
import { useToast } from "@/hooks/use-toast";

/**
 * useAuth — thin adapter so existing pages that call useAuth() keep working.
 * Internally powered by Clerk; no Supabase auth involved.
 */
export function useAuth() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
  };

  return {
    /** Clerk user object (null when not signed in) */
    user: isLoaded ? user ?? null : null,
    /** Kept for interface compatibility — Clerk doesn't use Sessions */
    session: null,
    /** True while Clerk is still loading */
    loading: !isLoaded,
    signOut: handleSignOut,
  };
}