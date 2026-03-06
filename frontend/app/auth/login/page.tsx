"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
// Import Firebase auth methods
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/database/firebase"; // <-- Adjust this path to your Firebase config

import {
  Shield,
  LogIn,
  ArrowRight,
  Loader2,
  LockKeyhole
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function LokNidhiLogin() {
  const router = useRouter();
  
  // Auth State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Firebase Log In Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      // 1. Authenticate with Firebase
      await signInWithEmailAndPassword(auth, email, password);
      
      console.log("User successfully logged in!");
      
      // 2. Redirect to the Role Selection Page 
      // (Adjust '/roles' to match whatever you named your role selection route)
      router.push("/role-based"); 
      
    } catch (err: any) {
      console.error(err);
      // Make Firebase errors more user-friendly
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError("Invalid email or password. Please try again.");
      } else {
        setError(err.message || "Failed to log in.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans selection:bg-[#FF9933] selection:text-white flex flex-col">
      {/* 1. Government Top Bar */}
      <div className="bg-gray-900 text-gray-200 text-xs py-1.5 px-4 md:px-10 flex justify-between items-center border-b-[3px] border-[#FF9933]">
        <div className="flex space-x-4 font-medium">
          <a href="#" className="hover:text-white transition-colors">Government of India</a>
          <span className="hidden md:inline text-gray-600">|</span>
          <a href="#" className="hidden md:inline hover:text-white transition-colors">Ministry of Finance</a>
        </div>
        <div className="flex space-x-4 items-center">
          <a href="#" className="hover:text-white transition-colors">Skip to Main Content</a>
          <div className="flex space-x-2 border-l pl-4 border-gray-600">
            <button className="hover:text-white transition-colors">A-</button>
            <button className="hover:text-white font-bold transition-colors">A</button>
            <button className="hover:text-white transition-colors">A+</button>
          </div>
          <button className="border-l pl-4 border-gray-600 hover:text-white transition-colors font-medium">English</button>
        </div>
      </div>

      {/* 2. Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="Satyameva Jayate" className="h-12 sm:h-14 w-auto drop-shadow-sm" />
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded flex items-center justify-center text-white font-bold text-xs">
              <img src="/PFMS-2.png" alt="PFMS Logo" className="h-10 sm:h-12 w-auto drop-shadow-sm" />
            </div>
            <div className="border-l-2 border-gray-200 pl-3 sm:pl-4">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#000080] tracking-tight">LokNidhi</h1>
              <p className="text-[9px] sm:text-xs text-gray-500 uppercase font-bold tracking-[0.1em] sm:tracking-[0.2em] mt-0.5">Authentication Portal</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center space-x-8 font-semibold text-gray-600">
            <Link href="/" className="hover:text-[#FF9933] transition-colors">Home</Link>
            <Link href="/auth/signup" className="flex items-center px-6 py-2.5 bg-[#000080] text-white rounded-lg hover:bg-blue-900 shadow-sm transition-all duration-300">
              Register <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Login Section */}
      <main className="flex-grow flex items-center justify-center py-12 px-4 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-5 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#000080] blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-[#FF9933] blur-3xl"></div>
        </div>

        <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-[#000080] relative z-10">
          <CardHeader className="space-y-1 pb-6">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 border border-blue-100 mb-4 mx-auto shadow-sm">
              <LockKeyhole className="w-7 h-7 text-[#000080]" />
            </div>
            <CardTitle className="text-2xl font-bold text-center text-gray-900">Official Login</CardTitle>
            <CardDescription className="text-center text-gray-500">
              Enter your credentials to access the National Budget Flow Intelligence platform.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form id="login-form" onSubmit={handleLogin} className="space-y-5">
              
              {/* Error Message Display */}
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200 flex items-start">
                  <Shield className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-semibold">Official Email (NIC/Gov)</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="name@gov.in" 
                    className="h-11 focus-visible:ring-[#000080]"
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-gray-700 font-semibold">Password</Label>
                    <a href="#" className="text-xs text-[#FF9933] font-medium hover:underline">Forgot password?</a>
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="••••••••" 
                    className="h-11 focus-visible:ring-[#000080]"
                    required 
                  />
                </div>
              </div>
            </form>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4 pt-4 bg-gray-50/50 rounded-b-xl border-t border-gray-100">
            <Button 
              form="login-form" 
              type="submit" 
              disabled={loading}
              className="w-full h-12 bg-[#000080] hover:bg-blue-900 text-white font-semibold text-base transition-all shadow-md hover:shadow-lg"
            >
              {loading ? (
                <>Authenticating <Loader2 className="ml-2 w-5 h-5 animate-spin" /></>
              ) : (
                <>Secure Login <LogIn className="ml-2 w-5 h-5" /></>
              )}
            </Button>
            
            <p className="text-sm text-center text-gray-600 pt-2">
              Don't have an official account?{" "}
              <Link href="./signup" className="text-[#000080] font-bold hover:underline">
                Register as Official
              </Link>
            </p>
          </CardFooter>
        </Card>
      </main>

      {/* 5. Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 border-t-4 border-[#FF9933] mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
            <p>© {new Date().getFullYear()} Government of India. All rights reserved.</p>
            <p className="mt-2 md:mt-0 flex items-center">
              <Shield className="w-3 h-3 mr-1" /> Highly Confidential & Secure Portal
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
