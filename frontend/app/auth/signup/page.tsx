"use client";

import React, { useState, useMemo } from "react";
// Import Firebase auth and firestore methods
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/database/firebase"; // Adjust this path

import {
  Shield,
  MapPin,
  Building2,
  UserCircle,
  LogIn,
  ArrowRight,
  Info,
  Loader2
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import formData from "../options.json";
import { useRouter } from "next/navigation";

export default function LokNidhiSignup() {
  const router = useRouter();
  const [formValues, setFormValues] = useState({
    fullName: "",
    email: "",
    password: "",
    department: "",
    role: "",
    stateCode: "",
    districtCode: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateForm = (updates: Partial<typeof formValues>) => {
    setFormValues((prev) => ({ ...prev, ...updates }));
  };

  // Derived Logic for Dropdowns
  const selectedRoleData = formData.roles.find((r) => r.id === formValues.role);
  const requiresLocation = selectedRoleData?.requires_location;

  const showState = ["STATE", "DISTRICT"].includes(requiresLocation as string);
  const showDistrict = requiresLocation === "DISTRICT";

  // Filter Geography Options
  const availableDistricts = useMemo(() => {
    return formData.geography.find((s) => s.state_code === formValues.stateCode)?.districts || [];
  }, [formValues.stateCode]);

  const isCentralAdmin = formValues.role === "CENTRAL_ADMIN";
  const showDepartment = !isCentralAdmin;

  // Handlers to reset child fields when parents change
  const handleRoleChange = (val: string) => {
    updateForm({
      role: val,
      stateCode: "",
      districtCode: "",
      department: val === "CENTRAL_ADMIN" ? "" : formValues.department,
    });
  };

  const handleStateChange = (val: string) => {
    updateForm({ stateCode: val, districtCode: "" });
  };

  const handleDistrictChange = (val: string) => {
    updateForm({ districtCode: val });
  };

  // Firebase Sign Up & Firestore Handler
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!formValues.email || !formValues.password || !formValues.fullName || !formValues.role) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!isCentralAdmin && !formValues.department) {
      setError("Please select your department.");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formValues.email, 
        formValues.password
      );
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        fullName: formValues.fullName,
        email: formValues.email,
        department: isCentralAdmin ? null : formValues.department,
        role: formValues.role,
        jurisdiction: {
          stateCode: formValues.stateCode,
          districtCode: formValues.districtCode,
        },
        createdAt: new Date().toISOString(),
        isActive: true
      });

      console.log("User successfully created and saved to Firestore:", user.uid);
      router.push("/role-based");
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create an account.");
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
              <p className="text-[9px] sm:text-xs text-gray-500 uppercase font-bold tracking-[0.1em] sm:tracking-[0.2em] mt-0.5">Registration Portal</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center space-x-8 font-semibold text-gray-600">
            <a href="/" className="hover:text-[#FF9933] transition-colors">Home</a>
            <Button variant={"outline"} className="flex items-center px-6 py-2.5 rounded-lghover:bg-gray-200 shadow-sm transition-all duration-300">
              Sign In <LogIn className="ml-2 w-4 h-4" />
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Form Section */}
      <main className="flex-grow flex items-center justify-center py-12 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-5 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#000080] blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-[#FF9933] blur-3xl"></div>
        </div>

        <Card className="w-full max-w-2xl shadow-xl border-t-4 border-t-[#000080] relative z-10">
          <CardHeader className="space-y-1 pb-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 mb-4 mx-auto">
              <Shield className="w-6 h-6 text-[#000080]" />
            </div>
            <CardTitle className="text-3xl font-bold text-center text-gray-900">Create Official Account</CardTitle>
            <CardDescription className="text-center text-gray-500">
              Register to access the National Budget Flow Intelligence platform.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form id="signup-form" onSubmit={handleSignUp} className="space-y-6">
              
              {/* Error Message Display */}
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center uppercase tracking-wider">
                  <UserCircle className="w-4 h-4 mr-2 text-[#FF9933]" />
                  User Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" value={formValues.fullName} onChange={(e) => updateForm({ fullName: e.target.value })} placeholder="Enter official name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Official Email</Label>
                    <Input id="email" type="email" value={formValues.email} onChange={(e) => updateForm({ email: e.target.value })} placeholder="name@gov.in" required />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" value={formValues.password} onChange={(e) => updateForm({ password: e.target.value })} placeholder="••••••••" required minLength={6} />
                  </div>
                  {showDepartment && (
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Select value={formValues.department} onValueChange={(val) => updateForm({ department: val })} required={!isCentralAdmin}>
                        <SelectTrigger id="department" className="w-full bg-white border-[#000080]/30">
                          <SelectValue placeholder="Select your department" />
                        </SelectTrigger>
                        <SelectContent className="w-full bg-white z-50">
                          {formData.departments.map((dept: any) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              <div className="h-px bg-gray-100 my-6"></div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center uppercase tracking-wider">
                  <Building2 className="w-4 h-4 mr-2 text-[#FF9933]" />
                  Role & Jurisdiction
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="role">Designated Role</Label>
                  <Select value={formValues.role} onValueChange={handleRoleChange} required>
                    <SelectTrigger id="role" className="w-full bg-white border-[#000080]/30 focus:ring-[#000080]">
                      <SelectValue placeholder="Select administrative role" />
                    </SelectTrigger>
                    <SelectContent className="w-full bg-white z-50">
                      {formData.roles.map((r: any) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formValues.role === "CENTRAL_DEPT" && (
                  <div className="bg-purple-50/50 p-3 rounded-md border border-purple-100 flex items-start space-x-2">
                    <Info className="w-4 h-4 text-[#8B5CF6] mt-0.5 shrink-0" />
                    <p className="text-xs text-gray-600 leading-relaxed">
                      <span className="font-semibold text-[#8B5CF6]">Central Department Logic:</span> You oversee nationwide allocations strictly for your selected department and disburse funds down to State Authorities.
                    </p>
                  </div>
                )}

                {formValues.role === "DISTRICT_DDO" && (
                  <div className="bg-green-50/50 p-3 rounded-md border border-green-100 flex items-start space-x-2">
                    <Info className="w-4 h-4 text-[#138808] mt-0.5 shrink-0" />
                    <p className="text-xs text-gray-600 leading-relaxed">
                      <span className="font-semibold text-[#138808]">District Authority Logic:</span> You are the local nodal point. You receive funds from State DDOs or Central Agencies and manage end-mile utilization.
                    </p>
                  </div>
                )}

                {requiresLocation && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-4 mt-2">
                    <div className="flex items-center text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      <MapPin className="w-3 h-3 mr-1" /> Geographical Mapping
                    </div>

                    {showState && (
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Select value={formValues.stateCode} onValueChange={handleStateChange} required>
                          <SelectTrigger id="state" className="w-full bg-white">
                            <SelectValue placeholder="Select State" />
                          </SelectTrigger>
                          <SelectContent className="w-full bg-white z-50 max-h-60">
                            {formData.geography.map((state: any) => (
                              <SelectItem key={state.state_code} value={state.state_code}>
                                {state.state_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {showDistrict && (
                      <div className="space-y-2">
                        <Label htmlFor="district">District</Label>
                        <Select value={formValues.districtCode} onValueChange={handleDistrictChange} disabled={!formValues.stateCode} required={showDistrict}>
                          <SelectTrigger id="district" className="w-full bg-white">
                            <SelectValue placeholder="Select District" />
                          </SelectTrigger>
                          <SelectContent className="w-full bg-white z-50 max-h-60">
                            {availableDistricts.length === 0 ? (
                               <p className="p-2 text-sm text-gray-500">No districts available for this state.</p>
                            ) : (
                               availableDistricts.map((dist: any) => (
                                <SelectItem key={dist.district_code} value={dist.district_code}>
                                  {dist.district_name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                  </div>
                )}
              </div>
            </form>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4 pt-6 bg-gray-50/50 rounded-b-xl border-t border-gray-100">
            <Button 
              form="signup-form" 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#000080] hover:bg-blue-900 text-white font-semibold py-6 text-lg transition-all"
            >
              {loading ? (
                <>Processing <Loader2 className="ml-2 w-5 h-5 animate-spin" /></>
              ) : (
                <>Submit Registration <ArrowRight className="ml-2 w-5 h-5" /></>
              )}
            </Button>
            <p className="text-xs text-center text-gray-500">
              By registering, you agree to the Government of India{" "}
              <a href="#" className="text-[#FF9933] hover:underline">Terms of Use</a>{" "}
              and{" "}
              <a href="#" className="text-[#FF9933] hover:underline">Privacy Policy</a>.
            </p>
          </CardFooter>
        </Card>
      </main>

      {/* 5. Footer */}
      <footer className="bg-gray-900 text-gray-300 py-10 border-t-4 border-[#FF9933] mt-auto">
        <div className="container mx-auto px-4">
          <div className="pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
            <p>© {new Date().getFullYear()} Government of India. All rights reserved.</p>
            <p className="mt-2 md:mt-0">Designed & Developed for proactive public financial governance.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}