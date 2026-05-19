import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserButton, useUser } from "@clerk/clerk-react";
import GlassSurface from "@/components/GlassSurface";

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

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isSignedIn } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full pt-6 px-4">
      <div className="container max-w-[1600px] mx-auto p-0">
        <GlassSurface width="100%" height="auto" borderRadius={40} opacity={0.7} backgroundOpacity={0.2} distortionScale={0} blur={20} className="w-full shadow-lg border border-white/20">
          <div className="flex h-16 md:h-20 items-center justify-between px-6 md:px-8 w-full gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center shrink-0">
              <span className="text-xl md:text-2xl font-semibold text-gray-900 tracking-tight whitespace-nowrap">FARM SHIELD<sup className="text-sm font-medium">®</sup></span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden xl:flex items-center justify-center gap-3 lg:gap-5 flex-1 px-2 overflow-hidden">
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
            <div className="hidden md:flex items-center gap-4 shrink-0">
              {isSignedIn ? (
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-sm text-gray-600 hover:text-gray-900"
                    onClick={() => navigate("/history")}
                  >
                    <History className="mr-1.5 h-4 w-4" />
                    History
                  </Button>
                  {/* Clerk's built-in user button — handles avatar, profile, sign out */}
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "h-9 w-9",
                      },
                    }}
                  />
                </div>
              ) : (
                <Button className="bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-full px-6 py-2 text-sm font-medium" asChild>
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
                {isSignedIn ? (
                  <div className="flex items-center gap-3">
                    <UserButton
                      afterSignOutUrl="/"
                      appearance={{
                        elements: {
                          avatarBox: "h-10 w-10",
                        },
                      }}
                    />
                    <span className="text-sm text-gray-600">Account</span>
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
}