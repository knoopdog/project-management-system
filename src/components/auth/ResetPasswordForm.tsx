import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import { supabase } from "../../../supabase/supabase";

export default function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have the access token in the URL
    const hash = window.location.hash;
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("access_token");

    if ((!hash || !hash.includes("access_token")) && !accessToken) {
      setError("Invalid or expired reset link. Please request a new one.");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setMessage("Your password has been successfully reset!");
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error: any) {
      console.error("Update password error:", error);
      setError(error.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-center mb-6">
          Set New Password
        </h2>

        {message ? (
          <div className="p-4 bg-green-50 text-green-700 rounded-lg">
            {message}
            <p className="mt-2 text-sm">Redirecting to login page...</p>
          </div>
        ) : error && !error.includes("Invalid or expired") ? (
          <div className="space-y-6">
            <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  New Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium text-gray-700"
                >
                  Confirm New Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-12 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                className="w-full h-12 rounded-full bg-black text-white hover:bg-gray-800 text-sm font-medium"
                disabled={isLoading}
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  New Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium text-gray-700"
                >
                  Confirm New Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-12 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                className="w-full h-12 rounded-full bg-black text-white hover:bg-gray-800 text-sm font-medium"
                disabled={isLoading}
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
