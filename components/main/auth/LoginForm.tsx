/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type React from "react";
import { useState } from "react";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import axios from "axios";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [loading, setLoading] = useState(false); // Added loading state
  const [showResetDialog, setShowResetDialog] = useState(false); // Added state to manage reset password dialog
  const [newPassword, setNewPassword] = useState(""); // New password state
  const [resetErrors, setResetErrors] = useState<string | null>(null); // For reset password validation
  const router = useRouter();

  // Basic validation logic with email regex
  const validate = () => {
    const errors: { email?: string; password?: string } = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      errors.email = "Email is required.";
    } else if (!emailRegex.test(email)) {
      errors.email = "Invalid email format.";
    }

    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }

    return errors;
  };

  // Reset password handler
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResetErrors(null);

    if (!newPassword) {
      setResetErrors("New password is required.");
      setLoading(false);
      return;
    }

    try {
      const resp = await axios.post(
        "https://voice-agent.kognifi.ai/reset-password",
        {
          username: email,
          new_password: newPassword,
        }
      );
      toast.success(resp.data.message, { richColors: true });
      setShowResetDialog(false); // Close dialog after success
    } catch (error: any) {
      console.error(error);
      toast.error(
        error.response.data.detail ||
          "Failed to reset password. Please try again later.",
        { richColors: true }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); // Set loading state to true
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false); // Set loading state to false
      return;
    }

    try {
      const resp = await axios.post("/api/login", {
        username: email,
        password: password,
      });
      toast.success(resp.data.message, { richColors: true });
      router.refresh();
    } catch (error: any) {
      console.error(error);
      toast.error(
        error.response.data.detail ||
          "Failed to login. Please try again later.",
        { richColors: true }
      );
    } finally {
      setLoading(false);
      setErrors({});
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.3, type: "spring", stiffness: 100 }}
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  placeholder="name@example.com"
                  type="email"
                  className="pl-10"
                  required
                  value={email}
                  onChange={(e: any) => setEmail(e.target.value)}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">{errors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto text-xs"
                  onClick={() => setShowResetDialog(true)} // Open the reset password dialog
                >
                  Forgot password?
                </Button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="pl-10 pr-10"
                  placeholder="******"
                  value={password}
                  onChange={(e: any) => setPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-10 w-10"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {showPassword ? "Hide password" : "Show password"}
                  </span>
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 mt-1">{errors.password}</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full cursor-pointer"
              disabled={loading}
            >
              {loading ? "Loading..." : "Sign In"}
            </Button>
          </div>
        </form>
      </motion.div>

      {/* Reset Password Dialog */}
      {showResetDialog && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-80">
            <h2 className="text-lg font-semibold mb-4">Reset Password</h2>
            <form onSubmit={handleResetPassword}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      value={email}
                      className="pl-10"
                      readOnly
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type="password"
                      className="pl-10"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  {resetErrors && (
                    <p className="text-sm text-red-600 mt-1">{resetErrors}</p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full cursor-pointer"
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Reset Password"}
                </Button>
              </div>
            </form>
            <Button
              variant="link"
              className="mt-4 p-0 text-xs"
              onClick={() => setShowResetDialog(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
