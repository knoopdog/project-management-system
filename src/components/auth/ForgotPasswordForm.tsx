import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import { supabase } from "../../../supabase/supabase";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      // Create the full redirect URL with hash fragment support
      const redirectUrl = `${window.location.origin}/reset-password`;
      console.log("Reset password redirect URL:", redirectUrl);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      setMessage(
        "Password reset instructions have been sent to your email address.",
      );
    } catch (error: any) {
      console.error("Reset password error:", error);
      setError(error.message || "Failed to send reset password email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-center mb-6">Reset Password</h2>

        {message ? (
          <div className="space-y-6">
            <div className="p-4 bg-green-50 text-green-700 rounded-lg">
              {message}
            </div>
            <Button
              type="button"
              className="w-full h-12 rounded-full bg-black text-white hover:bg-gray-800 text-sm font-medium"
              onClick={() => setMessage("")}
            >
              Send Again
            </Button>
            <div className="text-sm text-center text-gray-600 mt-6">
              <Link
                to="/login"
                className="text-blue-600 hover:underline font-medium"
              >
                Back to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-gray-700"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button
              type="submit"
              className="w-full h-12 rounded-full bg-black text-white hover:bg-gray-800 text-sm font-medium"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Reset Password"}
            </Button>

            <div className="text-sm text-center text-gray-600 mt-6">
              Remember your password?{" "}
              <Link
                to="/login"
                className="text-blue-600 hover:underline font-medium"
              >
                Sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}
