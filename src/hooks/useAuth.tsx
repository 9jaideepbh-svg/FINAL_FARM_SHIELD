import { useFirebaseAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

/**
 * useAuth — thin adapter so existing pages that call useAuth() keep working.
 * Internally powered by Firebase Auth.
 */
export function useAuth() {
  const { user, loading, signOut: firebaseSignOut } = useFirebaseAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await firebaseSignOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
  };

  return {
    /** Firebase user object (null when not signed in) */
    user: loading ? null : user ?? null,
    /** Kept for interface compatibility */
    session: null,
    /** True while Firebase is still loading auth state */
    loading,
    signOut: handleSignOut,
  };
}