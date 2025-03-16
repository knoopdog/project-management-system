import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "../../../supabase/supabase";
import { LoadingScreen } from "../ui/loading-spinner";

export default function AuthHandler() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleAuthentication = async () => {
      try {
        // Extract hash parameters from URL
        const hash = location.hash.substring(1);
        const params = new URLSearchParams(hash);

        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        const type = params.get("type");

        if (!accessToken || !refreshToken) {
          throw new Error("Invalid authentication link");
        }

        // Set the session in Supabase
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) throw error;

        // Check user role
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: userData } = await supabase
            .from("users")
            .select("is_client")
            .eq("id", user.id)
            .single();

          setIsClient(userData?.is_client === true);
        }

        // Wait a moment to ensure the session is set
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      } catch (err) {
        console.error("Authentication error:", err);
        setError(err instanceof Error ? err.message : "Failed to authenticate");
        setLoading(false);
      }
    };

    const checkUserRole = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: userData } = await supabase
            .from("users")
            .select("is_client")
            .eq("id", user.id)
            .single();

          setIsClient(userData?.is_client === true);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error checking user role:", err);
        setLoading(false);
      }
    };

    if (location.hash) {
      handleAuthentication();
    } else {
      checkUserRole();
    }
  }, [location]);

  if (loading) {
    return <LoadingScreen text="Processing authentication..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
          <h2 className="mb-4 text-xl font-bold text-red-600">
            Authentication Error
          </h2>
          <p className="mb-4 text-gray-700">{error}</p>
          <p className="mb-4 text-gray-700">
            The authentication link you used is invalid or has expired. Please
            request a new link or try logging in directly.
          </p>
          <a
            href="/login"
            className="block w-full py-2 text-center text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  // Redirect based on user role
  return isClient ? <Navigate to="/client" /> : <Navigate to="/dashboard" />;
}
