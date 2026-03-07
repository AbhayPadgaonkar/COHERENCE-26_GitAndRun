"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
// Import Firebase auth methods
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/database/firebase";

import {
  Shield,
  LogIn,
  ArrowRight,
  Loader2,
  LockKeyhole,
  AlertCircle,
  CheckCircle,
  Wallet
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

export default function LokNidhiLogin() {
  const router = useRouter();
  
  // Auth State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [metamaskLoading, setMetamaskLoading] = useState(false);
  const [authStep, setAuthStep] = useState<"idle" | "connecting" | "signing" | "verifying">("idle");
  const [hasMetamask, setHasMetamask] = useState(false);
  const [isMetamaskAuthenticated, setIsMetamaskAuthenticated] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");

  // Check for MetaMask on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasEthereum = !!(window as any).ethereum;
      setHasMetamask(hasEthereum);
      
      // Don't auto-load localStorage - always start fresh
      // Only restore if user explicitly wants to continue session
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("restoreSession") === "true") {
        const storedToken = localStorage.getItem("walletToken");
        const storedAddress = localStorage.getItem("walletAddress");
        if (storedToken && storedAddress) {
          setIsMetamaskAuthenticated(true);
          setWalletAddress(storedAddress);
        }
      }
    }
  }, []);

  // Firebase Log In Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isMetamaskAuthenticated) {
      setError("Please authenticate with MetaMask first to proceed with email/password login.");
      return;
    }

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("User successfully logged in!");
      router.push("/role-based"); 
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError("Invalid email or password. Please try again.");
      } else {
        setError(err.message || "Failed to log in.");
      }
    } finally {
      setLoading(false);
    }
  };

  // MetaMask Login Handler
  const handleMetaMaskLogin = async () => {
    setError("");
    setMetamaskLoading(true);
    setAuthStep("connecting");
    
    try {
      const ethereum = (window as any).ethereum;
      
      if (!ethereum) {
        setError("MetaMask not found. Please install MetaMask extension.");
        setMetamaskLoading(false);
        setAuthStep("idle");
        return;
      }

      // Step 1: Request accounts (Connect Wallet)
      console.log("Step 1: Requesting wallet connection...");
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      }).catch((err: any) => {
        if (err.code === 4001) {
          throw new Error("MetaMask connection rejected. Please approve to continue.");
        }
        throw err;
      });

      if (!accounts || accounts.length === 0) {
        setError("No MetaMask account found. Please create or unlock your wallet.");
        setMetamaskLoading(false);
        setAuthStep("idle");
        return;
      }

      const walletAddress = accounts[0];
      console.log("✅ Wallet connected:", walletAddress);

      // Step 2: Get signing message from backend
      setAuthStep("signing");
      console.log("Step 2: Fetching message to sign...");
      let messageData;
      try {
        const messageResponse = await fetch("http://127.0.0.1:8000/api/v1/auth/metamask/message", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          }
        });

        if (!messageResponse.ok) {
          throw new Error(`Backend error: ${messageResponse.status}`);
        }

        messageData = await messageResponse.json();
        console.log("📝 Message prepared for signing");
      } catch (fetchErr: any) {
        console.error("Backend fetch error:", fetchErr);
        setError("Could not connect to backend. Make sure backend is running on http://127.0.0.1:8000");
        setMetamaskLoading(false);
        setAuthStep("idle");
        return;
      }

      // Step 3: Request signature (Sign Digital Signature)
      console.log("Step 3: Requesting digital signature...");
      const signature = await ethereum.request({
        method: "personal_sign",
        params: [messageData.message, walletAddress],
      }).catch((err: any) => {
        if (err.code === 4001) {
          throw new Error("Signature request rejected. Please sign to authenticate.");
        }
        throw err;
      });
      
      console.log("✅ Digital signature signed successfully");

      // Step 4: Verify signature on backend
      setAuthStep("verifying");
      console.log("Step 4: Verifying signature with backend...");
      let verifyResponse;
      try {
        verifyResponse = await fetch("http://127.0.0.1:8000/api/v1/auth/metamask/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            address: walletAddress,
            message: messageData.message,
            signature: signature,
            nonce: messageData.nonce,
          }),
        });

        if (!verifyResponse.ok) {
          const errorData = await verifyResponse.json();
          throw new Error(errorData.detail || "Signature verification failed");
        }

        const verifyData = await verifyResponse.json();

        // Store token
        if (verifyData.token) {
          localStorage.setItem("walletToken", verifyData.token);
          localStorage.setItem("walletAddress", walletAddress);
          setWalletAddress(walletAddress);
          setIsMetamaskAuthenticated(true);
          setAuthStep("idle");
          console.log("✅ MetaMask authentication successful!");
        }
      } catch (verifyErr: any) {
        console.error("Verification error:", verifyErr);
        setError(verifyErr.message || "Backend verification failed. Please check backend logs.");
        setMetamaskLoading(false);
        setAuthStep("idle");
        return;
      }

    } catch (err: any) {
      console.error("MetaMask error:", err);
      setError(err.message || "MetaMask authentication failed. Please try again.");
      setAuthStep("idle");
    } finally {
      setMetamaskLoading(false);
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
            {/* Error Message Display */}
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200 flex items-start mb-5">
                <Shield className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Authentication Progress Indicator */}
            {metamaskLoading && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-5">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900">
                      {authStep === "connecting" && "🔗 Connecting Wallet..."}
                      {authStep === "signing" && "✍️ Signing Digital Signature..."}
                      {authStep === "verifying" && "⏳ Verifying Signature..."}
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      {authStep === "connecting" && "Please select your wallet in the MetaMask popup"}
                      {authStep === "signing" && "Please sign the message in MetaMask (no gas fees)"}
                      {authStep === "verifying" && "Verifying your signature with the backend"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: MetaMask Authentication */}
            <div className="space-y-4">
              <div className="text-sm font-semibold text-gray-700 flex items-center">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-[#000080] text-white text-xs rounded-full font-bold mr-2">1</span>
                Wallet Authentication (Required)
              </div>

              {!hasMetamask ? (
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 text-sm">
                  <p className="text-yellow-800 font-medium mb-2">MetaMask Not Found</p>
                  <p className="text-yellow-700 text-xs mb-3">
                    You need MetaMask to access this secure portal. Install it to proceed.
                  </p>
                  <a 
                    href="https://metamask.io" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded text-xs font-medium transition-colors"
                  >
                    Install MetaMask
                  </a>
                </div>
              ) : (
                <Button 
                  onClick={handleMetaMaskLogin}
                  disabled={metamaskLoading || isMetamaskAuthenticated}
                  type="button"
                  className="w-full h-12 bg-black hover:bg-gray-800 text-white font-semibold text-base transition-all shadow-md hover:shadow-lg"
                >
                  {metamaskLoading ? (
                    <>
                      <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                      {authStep === "connecting" && "Connecting Wallet..."}
                      {authStep === "signing" && "Signing Digital Signature..."}
                      {authStep === "verifying" && "Verifying Signature..."}
                    </>
                  ) : isMetamaskAuthenticated ? (
                    <>
                      <Shield className="mr-2 w-5 h-5 text-green-400" />
                      Wallet Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </>
                  ) : (
                    <>
                      Connect with MetaMask <LogIn className="ml-2 w-5 h-5" />
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Step 2: Email/Password (Only if MetaMask authenticated) */}
            {isMetamaskAuthenticated && (
              <>
                <div className="my-6 border-t border-gray-200"></div>
                
                <div className="space-y-4">
                  <div className="text-sm font-semibold text-gray-700 flex items-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-[#000080] text-white text-xs rounded-full font-bold mr-2">2</span>
                    Email & Password
                  </div>

                  <form id="login-form" onSubmit={handleLogin} className="space-y-5">
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
                </div>
              </>
            )}

            {/* Security Note */}
            {!isMetamaskAuthenticated && (
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <span className="font-semibold">🔒 Security First:</span> MetaMask authentication ensures secure blockchain-verified access to this government portal. Your wallet never shares private keys.
                </p>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4 pt-4 bg-gray-50/50 rounded-b-xl border-t border-gray-100">
            {isMetamaskAuthenticated && (
              <>
                <Button 
                  form="login-form" 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-12 bg-[#000080] hover:bg-blue-900 text-white font-semibold text-base transition-all shadow-md hover:shadow-lg"
                >
                  {loading ? (
                    <>Authenticating <Loader2 className="ml-2 w-5 h-5 animate-spin" /></>
                  ) : (
                    <>Complete Secure Login <LogIn className="ml-2 w-5 h-5" /></>
                  )}
                </Button>

                <button 
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("walletToken");
                    localStorage.removeItem("walletAddress");
                    setIsMetamaskAuthenticated(false);
                    setWalletAddress("");
                    setError("");
                    setAuthStep("idle");
                  }}
                  className="text-sm text-gray-500 hover:text-red-600 font-medium transition-colors"
                >
                  🔄 Start Fresh Connection
                </button>
              </>
            )}

            {!isMetamaskAuthenticated && (
              <button 
                type="button"
                onClick={() => {
                  localStorage.removeItem("walletToken");
                  localStorage.removeItem("walletAddress");
                  setIsMetamaskAuthenticated(false);
                  setWalletAddress("");
                  setError("");
                  setAuthStep("idle");
                }}
                className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors text-center py-2"
              >
                Clear Session Cache
              </button>
            )}
            
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
