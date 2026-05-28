import { useState, memo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, History, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import GlassSurface from "@/components/GlassSurface";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/krishi-setu", label: "Krishi Setu" },
  { href: "/farmer-blog", label: "Kisan Times" },
  { href: "/diagnosis", label: "Diagnosis" },
  { href: "/schemes", label: "Government Schemes" },
  { href: "/price-forecast", label: "Price Forecasting" },
  { href: "/simulator", label: "Crop Simulator" },
  { href: "/weather", label: "Weather" },
  { href: "/soil-intelligence", label: "Soil Intelligence" },
];

export const Header = memo(function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, loading, signOut } = useAuth();
  const isSignedIn = !loading && !!user;
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full pt-6 px-4">
      <div className="container max-w-[1600px] mx-auto p-0">
        <GlassSurface width="100%" height="auto" borderRadius={40} opacity={0.7} backgroundOpacity={0.2} distortionScale={0} blur={20} className="w-full shadow-lg border border-white/20">
          <div className="flex h-16 md:h-20 items-center justify-between px-4 md:px-8 xl:px-4 2xl:px-8 w-full gap-2 md:gap-4 xl:gap-2 2xl:gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0 group">
              <div className="relative flex items-center justify-center w-8 h-8 md:w-10 md:h-10 xl:w-8 xl:h-8 2xl:w-10 2xl:h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-green-400 p-0.5 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                <img src="/favicon.ico" alt="Farm Shield Logo" className="w-full h-full object-cover rounded-[10px] bg-white" onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full bg-white rounded-[10px] flex items-center justify-center"><svg class="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg></div>';
                }} />
              </div>
              <span className="text-lg md:text-2xl xl:text-base 2xl:text-xl font-extrabold text-gray-900 tracking-tight whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-emerald-800 to-emerald-950">FARM SHIELD<sup className="text-[10px] md:text-sm xl:text-[10px] 2xl:text-xs font-medium text-emerald-600">®</sup></span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden xl:flex items-center justify-center gap-1 xl:gap-2 2xl:gap-5 flex-1 px-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`text-[11px] xl:text-[12px] 2xl:text-[13.5px] tracking-tight font-medium whitespace-nowrap transition-colors hover:text-gray-900 ${
                    location.pathname === link.href ? "text-gray-900" : "text-gray-600"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Desktop Auth */}
            <div className="hidden md:flex items-center gap-2 xl:gap-3 2xl:gap-4 shrink-0">
              {isSignedIn && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 xl:gap-0 2xl:gap-3 pl-1 pr-2 xl:pr-1 2xl:pr-5 py-1 rounded-full bg-[#f8f9fb] border border-gray-100 shadow-sm hover:shadow-md hover:bg-white transition-all focus:outline-none">
                      <div className="h-8 w-8 md:h-9 md:w-9 xl:h-8 xl:w-8 2xl:h-9 2xl:w-9 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 flex items-center justify-center text-white shadow-sm overflow-hidden">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-4 w-4 md:h-5 md:w-5 fill-current" />
                        )}
                      </div>
                      <span className="hidden md:inline-block xl:hidden 2xl:inline-block text-[13px] 2xl:text-[15px] font-semibold text-gray-800 tracking-wide ml-2 2xl:ml-0">
                        {(user.displayName || user.email?.split('@')[0] || 'USER').toUpperCase()}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-xl border-gray-100 shadow-xl bg-white p-2">
                    <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer rounded-lg py-2.5 font-medium text-gray-700 focus:bg-gray-50 focus:text-gray-900 transition-colors">
                      <User className="mr-2 h-4 w-4" />
                      <span>Manage Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/history")} className="cursor-pointer rounded-lg py-2.5 font-medium text-gray-700 focus:bg-gray-50 focus:text-gray-900 transition-colors">
                      <History className="mr-2 h-4 w-4" />
                      <span>History</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-1" />
                    <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer rounded-lg py-2.5 font-medium text-red-600 focus:bg-red-50 focus:text-red-700 transition-colors">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button className="bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-full px-4 py-1.5 xl:px-3 xl:text-[11px] 2xl:px-6 2xl:py-2 2xl:text-sm font-medium" asChild>
                  <Link to="/auth?tab=signin">Begin Journey</Link>
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="xl:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </GlassSurface>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="xl:hidden bg-white/95 backdrop-blur-lg shadow-xl absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden z-50 border border-gray-100">
            <nav className="p-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block text-lg font-medium transition-colors ${
                    location.pathname === link.href
                      ? "text-gray-900"
                      : "text-gray-500"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-6 mt-2 border-t border-gray-100">
                {isSignedIn && user ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 px-3 py-4 bg-gray-50/80 rounded-2xl mb-2 border border-gray-100">
                      <div className="h-11 w-11 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 flex items-center justify-center text-white shadow-sm overflow-hidden shrink-0">
                        {user.hasImage ? (
                          <img src={user.imageUrl} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-6 w-6 fill-current" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-base font-bold text-gray-800">
                          {user.fullName || user.primaryEmailAddress?.emailAddress?.split('@')[0]}
                        </span>
                        <span className="text-xs text-gray-500 truncate max-w-[200px]">
                          {user.primaryEmailAddress?.emailAddress}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full justify-start py-6 text-lg rounded-xl font-medium text-gray-700"
                      onClick={() => {
                        navigate("/profile");
                        setMobileMenuOpen(false);
                      }}
                    >
                      <User className="mr-3 h-5 w-5" />
                      Manage Profile
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start py-6 text-lg rounded-xl font-medium text-gray-700"
                      onClick={() => {
                        navigate("/history");
                        setMobileMenuOpen(false);
                      }}
                    >
                      <History className="mr-3 h-5 w-5" />
                      History
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start py-6 text-lg rounded-xl font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100 transition-colors"
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="mr-3 h-5 w-5" />
                      Sign out
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white py-6 text-lg rounded-xl"
                    asChild
                  >
                    <Link to="/auth?tab=signin" onClick={() => setMobileMenuOpen(false)}>
                      Begin Journey
                    </Link>
                  </Button>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
});