"use client";

import React, { useEffect, useState } from 'react';
import { 
  Building2, 
  Map, 
  MapPin, 
  ShieldCheck, 
  ArrowRight,
  Lock,
  Network,
  Home,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

// Firebase Imports
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/database/firebase'; // Adjust path as needed

// 1. Define Role Hierarchy Weights
// Higher number = Higher access level
const ROLE_WEIGHTS: Record<string, number> = {
  "CENTRAL_ADMIN": 5,
  "CNA_OFFICER": 4,
  "STATE_DDO": 3,
  "DISTRICT_DDO": 2,
  "BLOCK_DDO": 1,
};

// 2. Define Portal Cards Configuration
const PORTAL_CARDS = [
  {
    id: "central",
    title: "Central Government",
    description: "National budget overview, cross-state allocation tracking, and high-level anomaly detection.",
    icon: Building2,
    href: "/dashboard/central",
    color: "#FF9933", // Orange
    bgClass: "bg-orange-50",
    textClass: "text-[#FF9933]",
    borderHover: "hover:border-[#FF9933]",
    requiredWeight: 5
  },
  {
    id: "cna",
    title: "Central Nodal Agency",
    description: "Scheme-specific fund routing, vendor mapping, and direct block-level disbursement control.",
    icon: Network,
    href: "/central/option",
    color: "#8B5CF6", // Purple
    bgClass: "bg-purple-50",
    textClass: "text-[#8B5CF6]",
    borderHover: "hover:border-[#8B5CF6]",
    requiredWeight: 4
  },
  {
    id: "state",
    title: "State Government",
    description: "State-level nodal agency monitoring, district fund distribution, and scheme utilization analytics.",
    icon: Map,
    href: "/state",
    color: "#000080", // Navy Blue
    bgClass: "bg-blue-50",
    textClass: "text-[#000080]",
    borderHover: "hover:border-[#000080]",
    requiredWeight: 3
  },
  {
    id: "district",
    title: "District Authority",
    description: "Department spending logs, district-wide beneficiary tracking, and local lapse risk forecasting.",
    icon: MapPin,
    href: "/district",
    color: "#138808", // Green
    bgClass: "bg-green-50",
    textClass: "text-[#138808]",
    borderHover: "hover:border-[#138808]",
    requiredWeight: 2
  },
  {
    id: "block",
    title: "Block Authority",
    description: "Ground-level vendor payments, end-mile utilization logging, and immediate fund execution.",
    icon: Home,
    href: "/dashboard/block",
    color: "#0891B2", // Cyan
    bgClass: "bg-cyan-50",
    textClass: "text-[#0891B2]",
    borderHover: "hover:border-[#0891B2]",
    requiredWeight: 1
  }
];

export default function RoleSelectionPage() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 3. Fetch User Role on Mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setUserRole(docSnap.data().role);
          } else {
            console.error("User document not found in Firestore");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        // Handle unauthenticated state (e.g., redirect to login)
        // window.location.href = "/login";
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Determine current user's access weight (default to 0 if none)
  const userWeight = userRole ? ROLE_WEIGHTS[userRole] || 0 : 0;

  // Filter accessible portals based on hierarchy
  const accessiblePortals = PORTAL_CARDS.filter(card => userWeight >= card.requiredWeight);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#000080] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 shadow-sm">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" 
              alt="Satyameva Jayate" 
              className="h-10 sm:h-12 w-auto"
            />
            <img 
              src="/PFMS-2.png" 
              alt="PFMS Logo" 
              className="h-8 sm:h-10 w-auto"
            />
            <div className="border-l-2 border-gray-200 pl-3">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#000080] tracking-tight">LokNidhi</h1>
            </div>
          </div>
          <div className="flex items-center text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
            <Lock className="w-4 h-4 mr-2" /> Secure Portal
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-6xl w-full">
          
          {/* Header Text */}
          <div className="text-center mb-10">
            <ShieldCheck className="w-12 h-12 text-[#000080] mx-auto mb-4" />
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Select Your Access Level</h2>
            <p className="text-gray-500 max-w-lg mx-auto mb-2">
              Please choose your administrative tier to access the LokNidhi intelligence dashboard.
            </p>
            {userRole && (
               <p className="text-xs font-semibold text-[#FF9933] uppercase tracking-wider bg-orange-50 inline-block px-3 py-1 rounded-full border border-orange-200">
                 Current Profile: {userRole.replace('_', ' ')}
               </p>
            )}
          </div>

          {/* Dynamic Role Cards Grid */}
          {accessiblePortals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-center">
              {accessiblePortals.map((portal) => {
                const Icon = portal.icon;
                return (
                  <Link 
                    key={portal.id} 
                    href={portal.href} 
                    className={`group bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl ${portal.borderHover} transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden transform hover:-translate-y-1`}
                  >
                    {/* Hover Top Border Animation */}
                    <div 
                      className="absolute top-0 left-0 w-full h-1 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                      style={{ backgroundColor: portal.color }}
                    ></div>
                    
                    {/* Icon Container */}
                    <div className={`w-16 h-16 ${portal.bgClass} ${portal.textClass} rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{portal.title}</h3>
                    <p className="text-sm text-gray-500 mb-6 flex-1">
                      {portal.description}
                    </p>
                    
                    {/* Dynamic Footer Button */}
                    <div 
                      className={`mt-auto w-full flex items-center justify-center font-semibold text-sm group-hover:underline ${portal.textClass}`}
                    >
                      Enter Portal <ArrowRight className="w-4 h-4 ml-2" />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center p-8 bg-red-50 text-red-600 rounded-xl border border-red-200 max-w-md mx-auto">
              <p className="font-semibold">Access Denied</p>
              <p className="text-sm mt-1">Your account does not have sufficient privileges to view these portals, or your role configuration is missing.</p>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-gray-400">
        © {new Date().getFullYear()} LokNidhi Platform. Government of India.
      </footer>
    </div>
  );
}