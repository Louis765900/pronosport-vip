// @ts-nocheck
"use client";

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown,
  LogOut,
  LogIn,
  Zap,
  Menu,
  X,
  Home,
  Trophy,
  User,
  Shield,
  Wallet
} from 'lucide-react';
import { SPORTS, DEFAULT_SPORT } from '@/lib/config/sports';
import type { SportId } from '@/lib/config/sports';

interface NavbarProps {
  isLoggedIn: boolean;
  isAdmin: boolean;
  userRole?: 'admin' | 'vip' | 'free';
  activeSport?: SportId;
  onSportChange?: (sport: SportId) => void;
}

export function Navbar({ isLoggedIn, isAdmin, userRole, activeSport = DEFAULT_SPORT, onSportChange }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const sportTabsRef = useRef(null);

  const handleSportKeyDown = useCallback((e, currentIdx) => {
    const tabs = sportTabsRef.current?.querySelectorAll('[role="tab"]');
    if (!tabs) return;
    let next = currentIdx;
    if (e.key === 'ArrowRight') next = (currentIdx + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (currentIdx - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else return;
    e.preventDefault();
    tabs[next]?.focus();
    tabs[next]?.click();
  }, []);

  // Ne pas afficher la navbar sur /login, /join et /vip (elles ont leur propre nav)
  if (pathname === '/login' || pathname === '/join' || pathname === '/vip') {
    return null;
  }

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/login', { method: 'DELETE' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navLinks = [
    { href: '/dashboard', label: 'Accueil', icon: Home },
    { href: '/matchs', label: 'Combinées VIP', icon: Trophy },
    ...(userRole === 'vip' || userRole === 'admin'
      ? [{ href: '/mes-paris', label: 'Mes Paris', icon: Wallet }]
      : []
    ),
  ];

  const getRoleBadge = () => {
    switch (userRole) {
      case 'admin':
        return { text: 'ADMIN', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
      case 'vip':
        return { text: 'VIP', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
      case 'free':
        return { text: 'FREE', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
      default:
        return null;
    }
  };

  const roleBadge = getRoleBadge();

  // N'afficher les onglets sport que sur le dashboard
  const isDashboard = pathname === '/dashboard';

  return (
    <nav className="sticky top-0 z-50 apple-header">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16 gap-3">

          {/* ─── Gauche : Logo + Liens nav ─── */}
          <div className="flex items-center gap-1 shrink-0">
            <Link href="/dashboard" className="flex items-center gap-3 mr-2">
              <motion.div whileHover={{ scale: 1.05 }} className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                {isAdmin && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
                  >
                    <Shield className="w-2.5 h-2.5 text-white" />
                  </motion.div>
                )}
              </motion.div>
              <div className="hidden lg:block">
                <h1 className="text-lg font-bold text-white">
                  Prono<span className="text-amber-400">Scope</span>
                </h1>
                <p className="text-[10px] text-gray-500 -mt-0.5">Powered by AI</p>
              </div>
            </Link>

            {/* Nav links — desktop */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                      ${isActive
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    <link.icon className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ─── Centre : Onglets Sports (PC uniquement, dashboard seulement) ─── */}
          {isDashboard && (
            <div
              ref={sportTabsRef}
              role="tablist"
              aria-label="Sélection du sport"
              className="hidden md:flex items-center gap-1 overflow-x-auto flex-1 justify-center px-2"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {SPORTS.map((sport, idx) => {
                const isActive = activeSport === sport.id;
                return (
                  <button
                    key={sport.id}
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Sport : ${sport.label}`}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => onSportChange?.(sport.id)}
                    onKeyDown={(e) => handleSportKeyDown(e, idx)}
                    className={`
                      flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all shrink-0
                      ${isActive
                        ? 'text-black font-semibold shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-white/8 bg-white/5 border border-white/10'
                      }
                    `}
                    style={isActive ? { backgroundColor: sport.color, boxShadow: `0 0 12px ${sport.color}60` } : {}}
                  >
                    <span aria-hidden="true">{sport.emoji}</span>
                    <span>{sport.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* ─── Droite : Badge rôle + Admin + Auth + Mobile toggle ─── */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Role Badge */}
            {isLoggedIn && roleBadge && (
              <div className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold ${roleBadge.color}`}>
                {userRole === 'admin' && <Shield className="w-3 h-3" />}
                {userRole === 'vip' && <Crown className="w-3 h-3" />}
                {roleBadge.text}
              </div>
            )}

            {/* Admin Panel */}
            {isAdmin && (
              <Link
                href="/admin"
                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-lg text-xs font-semibold transition-all shadow-lg shadow-red-500/20"
              >
                <Zap className="w-3.5 h-3.5" />
                Admin
              </Link>
            )}

            {/* Auth Buttons */}
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-gray-300 hover:text-white transition-all disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"
                  />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {pathname === '/' && (
                  <Link
                    href="/join"
                    className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black rounded-lg text-sm font-bold transition-all shadow-lg shadow-amber-500/20"
                  >
                    S'inscrire
                  </Link>
                )}
                <Link
                  href="/login"
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-semibold text-white transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Connexion</span>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={isMobileMenuOpen}
              className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* ─── Mobile Menu ─── */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden border-t border-white/5"
            >
              <div className="py-4 space-y-2">
                {/* Nav links */}
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
                        ${isActive
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }
                      `}
                    >
                      <link.icon className="w-5 h-5" />
                      {link.label}
                    </Link>
                  );
                })}

                {/* ─── Section Sports (mobile, dashboard uniquement) ─── */}
                {isDashboard && (
                  <div className="pt-2">
                    <p className="px-4 pb-2 text-[10px] text-gray-500 font-semibold uppercase tracking-widest">
                      Sports
                    </p>
                    <div className="flex flex-wrap gap-2 px-4">
                      {SPORTS.map((sport) => {
                        const isActive = activeSport === sport.id;
                        return (
                          <button
                            key={sport.id}
                            onClick={() => {
                              onSportChange?.(sport.id);
                              setIsMobileMenuOpen(false);
                            }}
                            className={`
                              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                              ${isActive
                                ? 'text-black font-semibold'
                                : 'text-gray-400 bg-white/5 border border-white/10'
                              }
                            `}
                            style={isActive ? { backgroundColor: sport.color } : {}}
                          >
                            <span>{sport.emoji}</span>
                            <span>{sport.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Admin Panel Mobile */}
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-red-600/20 to-orange-600/20 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium"
                  >
                    <Zap className="w-5 h-5" />
                    Admin Panel
                  </Link>
                )}

                {/* Role Badge Mobile */}
                {isLoggedIn && roleBadge && (
                  <div className="px-4 py-2">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${roleBadge.color}`}>
                      {userRole === 'admin' && <Shield className="w-3.5 h-3.5" />}
                      {userRole === 'vip' && <Crown className="w-3.5 h-3.5" />}
                      {userRole === 'free' && <User className="w-3.5 h-3.5" />}
                      Connecté en tant que {roleBadge.text}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}

export default Navbar;
