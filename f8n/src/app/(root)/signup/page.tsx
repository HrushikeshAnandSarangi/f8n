// src/app/signup/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    full_name: "",
    dob: "",
    gender: "",
    phone_number: "",
    email: "",
    pan_no: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    // Full name validation
    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    }

    // DOB validation
    if (!formData.dob) {
      newErrors.dob = "Date of birth is required";
    }

    // Gender validation
    if (!formData.gender) {
      newErrors.gender = "Please select a gender";
    }

    // Phone validation
    if (!formData.phone_number) {
      newErrors.phone_number = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone_number)) {
      newErrors.phone_number = "Please enter a valid 10-digit phone number";
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // PAN validation
    if (!formData.pan_no) {
      newErrors.pan_no = "PAN number is required";
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan_no)) {
      newErrors.pan_no = "Please enter a valid PAN number";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      // Here you would typically send the data to your API
      console.log("Form submitted:", formData);
      
      // Mock successful registration
      setTimeout(() => {
        router.push("/login"); // Redirect to login page after successful signup
      }, 1500);
    } catch (error) {
      console.error("Signup error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-16 px-6 sm:px-8 lg:px-12">
      <div className="max-w-3xl w-full bg-gray-800 p-10 rounded-2xl shadow-xl">
        <div className="mb-10">
          <h2 className="text-center text-4xl font-bold text-white">
            Create your account
          </h2>
          <p className="mt-3 text-center text-lg text-gray-400">
            Join our platform today
          </p>
        </div>
        
        <form className="space-y-8" onSubmit={handleSubmit}>
          {/* Two-column layout for wider screens */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Full Name */}
            <div>
              <label htmlFor="full_name" className="block text-base font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                autoComplete="name"
                required
                value={formData.full_name}
                onChange={handleChange}
                className="block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                placeholder="John Doe"
              />
              {errors.full_name && (
                <p className="mt-2 text-sm text-red-400">{errors.full_name}</p>
              )}
            </div>
            
            {/* Date of Birth */}
            <div>
              <label htmlFor="dob" className="block text-base font-medium text-gray-300 mb-2">
                Date of Birth
              </label>
              <input
                id="dob"
                name="dob"
                type="date"
                required
                value={formData.dob}
                onChange={handleChange}
                className="block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
              />
              {errors.dob && (
                <p className="mt-2 text-sm text-red-400">{errors.dob}</p>
              )}
            </div>
            
            {/* Gender */}
            <div>
              <label htmlFor="gender" className="block text-base font-medium text-gray-300 mb-2">
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                required
                value={formData.gender}
                onChange={handleChange}
                className="block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
              {errors.gender && (
                <p className="mt-2 text-sm text-red-400">{errors.gender}</p>
              )}
            </div>
            
            {/* Phone Number */}
            <div>
              <label htmlFor="phone_number" className="block text-base font-medium text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                id="phone_number"
                name="phone_number"
                type="tel"
                autoComplete="tel"
                required
                value={formData.phone_number}
                onChange={handleChange}
                className="block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                placeholder="1234567890"
              />
              {errors.phone_number && (
                <p className="mt-2 text-sm text-red-400">{errors.phone_number}</p>
              )}
            </div>
            
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-base font-medium text-gray-300 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                placeholder="example@email.com"
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-400">{errors.email}</p>
              )}
            </div>
            
            {/* PAN Number */}
            <div>
              <label htmlFor="pan_no" className="block text-base font-medium text-gray-300 mb-2">
                PAN Number
              </label>
              <input
                id="pan_no"
                name="pan_no"
                type="text"
                required
                value={formData.pan_no}
                onChange={handleChange}
                className="block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                placeholder="ABCDE1234F"
              />
              {errors.pan_no && (
                <p className="mt-2 text-sm text-red-400">{errors.pan_no}</p>
              )}
            </div>
            
            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-base font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                placeholder="********"
              />
              {errors.password && (
                <p className="mt-2 text-sm text-red-400">{errors.password}</p>
              )}
            </div>
            
            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-base font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                placeholder="********"
              />
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-400">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-lg text-white transition-colors ${
                loading ? "bg-indigo-600 opacity-70" : "bg-indigo-600 hover:bg-indigo-700"
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg`}
            >
              {loading ? "Signing up..." : "Create Account"}
            </button>
          </div>
          
          <div className="text-center pt-4">
            <p className="text-base text-gray-400">
              Already have an account?{" "}
              <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
                Log in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}