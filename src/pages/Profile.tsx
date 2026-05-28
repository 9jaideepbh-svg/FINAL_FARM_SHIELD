import { UserProfile } from "@clerk/clerk-react";
import { Layout } from "@/components/layout/Layout";
import { User as UserIcon } from "lucide-react";
import { m } from "framer-motion";

export default function Profile() {
  return (
    <Layout>
      <div className="relative min-h-[calc(100vh-8rem)] w-full py-8 md:py-12 px-4 overflow-hidden">
        {/* Futuristic background elements */}
        <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-green-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="container max-w-5xl mx-auto relative z-10">
          {/* Header row */}
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
                Customize your credentials, secure your account, or update login settings
              </p>
            </div>
          </m.div>

          {/* Clerk Profile Component with responsive emerald styles */}
          <m.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full flex justify-center bg-white/40 border border-white/60 shadow-xl rounded-[28px] backdrop-blur-xl p-4 md:p-6 overflow-hidden"
          >
            <div className="w-full max-w-4xl custom-clerk-wrapper">
              <UserProfile 
                routing="hash"
                appearance={{
                  elements: {
                    rootBox: "w-full shadow-none bg-transparent border-0",
                    cardBox: "bg-transparent border-0 shadow-none w-full",
                    card: "bg-transparent border-0 shadow-none w-full",
                    navbar: "bg-white/45 backdrop-blur-md border border-white/60 rounded-2xl p-4 shadow-sm hidden md:flex min-w-[220px]",
                    navbarMobileMenuButton: "text-emerald-700 hover:bg-emerald-50 rounded-xl",
                    headerTitle: "text-gray-900 font-extrabold text-2xl tracking-tight",
                    headerSubtitle: "text-gray-500 text-sm",
                    profileSectionTitleText: "text-emerald-900 font-bold border-b border-emerald-100/50 pb-2 text-base",
                    formButtonPrimary: "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold rounded-xl shadow-md transition-all shadow-emerald-500/10 border-0 px-5 py-2.5",
                    formFieldInput: "bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-emerald-500 px-4 py-3 text-sm transition-all shadow-inner",
                    avatarImageActionsUpload: "text-emerald-700 font-bold hover:bg-emerald-50 rounded-lg",
                    userPreviewSecondaryIdentifier: "text-gray-500 font-medium",
                    userPreviewMainIdentifier: "text-gray-950 font-bold",
                    badge: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 font-semibold",
                    breadcrumbsItem: "text-emerald-700 font-semibold",
                    breadcrumbsSeparator: "text-gray-400",
                    scrollBox: "shadow-none border-0 bg-transparent rounded-none",
                    pageScrollBox: "px-2 py-4 md:p-6",
                    profileSection: "border-b border-gray-100/60 pb-8 mb-8 last:border-0 last:pb-0 last:mb-0",
                  }
                }}
              />
            </div>
          </m.div>
        </div>
      </div>
    </Layout>
  );
}
