"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/database/firebase"; // Adjust path if needed
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

// Create Context
const AuthContext = createContext<{ user: User | null; loading: boolean }>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle Redirections
  useEffect(() => {
    if (loading) return; // Do nothing while verifying session

    // Define public routes (where unauthenticated users are allowed)
    const isPublicRoute = pathname === "/" || pathname === "/login" || pathname === "/signup";

    if (!user && !isPublicRoute) {
      // If no user and trying to access a protected route -> send to Landing Page
      router.push("/");
    } else if (user && isPublicRoute) {
      // If user is logged in but tries to view login/landing page -> send to Roles
      router.push("/role-based"); // Ensure this matches your actual role page route
    }
  }, [user, loading, pathname, router]);

  // Show a global loading spinner while checking auth state to prevent UI flicker
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-[#000080] animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to easily grab auth state anywhere in your app
export const useAuth = () => useContext(AuthContext);