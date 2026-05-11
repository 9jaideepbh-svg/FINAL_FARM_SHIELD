import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, LogOut, User, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import GlassSurface from "@/components/GlassSurface";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/krishi-setu", label: "Krishi Setu" },
  { href: "/farmer-blog", label: "Kisan Times" },
  { href: "/diagnosis", label: "Diagnosis" },
  { href: "/price-forecast", label: "Price Forecasting" },
  { href: "/weather", label: "Weather" },
  { href: "/soil", label: "Soil Analysis" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full pt-6 px-4">
      <div className="container max-w-7xl mx-auto p-0">
        <GlassSurface width="100%" height="auto" borderRadius={40} opacity={0.7} backgroundOpacity={0.2} distortionScale={0} blur={20} className="w-full shadow-lg border border-white/20">
          <div className="flex h-16 md:h-20 items-center justify-between px-6 md:px-8 w-full">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <span className="text-xl md:text-2xl font-semibold text-gray-900 tracking-tight whitespace-nowrap">FARM SHIELD<sup className="text-sm font-medium">®</sup></span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden xl:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`text-sm font-medium whitespace-nowrap transition-colors hover:text-gray-900 ${
                    location.pathname === link.href ? "text-gray-900" : "text-gray-600"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Desktop Auth */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gray-900 text-white">
                          {getInitials(user.email || "U")}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/history" className="cursor-pointer">
                        <History className="mr-2 h-4 w-4" />
                        Diagnosis History
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button className="bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-full px-6 py-2 text-sm font-medium" asChild>
                  <Link to="/auth?tab=signup">Begin Journey</Link>
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
                {user ? (
                  <Button
                    variant="outline"
                    className="w-full justify-start py-6 text-lg rounded-xl"
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="mr-2 h-5 w-5" />
                    Sign out
                  </Button>
                ) : (
                  <Button className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white py-6 text-lg rounded-xl" asChild>
                    <Link to="/auth?tab=signup" onClick={() => setMobileMenuOpen(false)}>
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
}