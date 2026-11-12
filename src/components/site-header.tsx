"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ShoppingBag, User, LogOut, LayoutDashboard, Utensils } from "lucide-react";

export function SiteHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Handle scroll effect for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/kitchens", label: "Find food" },
    { href: "/how-it-works", label: "How it works" },
    { href: "/orders", label: "My orders" },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm"
            : "bg-white border-b border-gray-100"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-green-800 rounded-full flex items-center justify-center text-white group-hover:bg-green-700 transition-colors">
                <Utensils size={20} />
              </div>
              <span className="text-2xl font-bold text-gray-900 tracking-tight">
                Bufer Feast<span className="text-green-600">.</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? "text-green-700"
                      : "text-gray-600 hover:text-green-700"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/account"
                className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-green-700 transition-colors"
              >
                <User size={18} />
                <span>My account</span>
              </Link>
              
              <Link
                href="/checkout"
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-full hover:bg-gray-800 transition-all hover:scale-105"
              >
                <ShoppingBag size={18} />
                <span>Basket</span>
                <span className="ml-1 px-2 py-0.5 bg-white text-gray-900 rounded-full text-xs font-bold">0</span>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-green-700 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Drawer */}
          <div className="absolute top-20 left-0 right-0 bg-white border-b border-gray-200 shadow-xl max-h-[calc(100vh-5rem)] overflow-y-auto">
            <div className="px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                    isActive(link.href)
                      ? "bg-green-50 text-green-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              
              <div className="border-t border-gray-100 pt-4 mt-4 space-y-3">
                <Link
                  href="/account"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  <User size={20} />
                  <span className="font-medium">My account</span>
                </Link>
                <Link
                  href="/vendor/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  <LayoutDashboard size={20} />
                  <span className="font-medium">Vendor Dashboard</span>
                </Link>
              </div>

              <Link
                href="/checkout"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors mt-4"
              >
                <ShoppingBag size={20} />
                <span>View Basket (0)</span>
              </Link>
            </div>
          </div>
        </div>
      )}
      
      {/* Spacer to prevent content from hiding under fixed header */}
      <div className="h-20" />
    </>
  );
}