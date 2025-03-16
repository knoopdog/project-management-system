import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../supabase/auth";
import { supabase } from "../../../supabase/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { User, Shield, UserPlus } from "lucide-react";

interface UserData {
  id: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  is_client?: boolean;
  company_id?: string;
}

export default function AdminPanel() {
  const { user, isAdmin, makeUserAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAdminEmail, setNewAdminEmail] = useState("");

  useEffect(() => {
    // Redirect if not admin
    if (!isAdmin && !loading) {
      navigate("/dashboard");
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        // Check if the supabase client is properly initialized
        if (!supabase) {
          throw new Error("Supabase client is not initialized");
        }

        console.log("Fetching users from Supabase...");
        const { data, error } = await supabase
          .from("users")
          .select("id, email, full_name, is_admin, is_client, company_id")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching users:", error);
          toast({
            title: "Error",
            description: `Failed to load users: ${error.message}`,
            variant: "destructive",
          });
          throw error;
        }

        console.log("Users data received:", data);
        setUsers(data || []);
      } catch (err) {
        console.error("Exception fetching users:", err);
        toast({
          title: "Error",
          description: `Failed to load users: ${err instanceof Error ? err.message : "Unknown error"}`,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const handleMakeAdmin = async (userId: string) => {
    try {
      await makeUserAdmin(userId);
      // Update the local state
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, is_admin: true } : u)),
      );
      toast({
        title: "Success",
        description: "User has been made an admin",
      });
    } catch (error) {
      console.error("Error making user admin:", error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const handleMakeCurrentUserAdmin = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "No user is currently logged in",
        variant: "destructive",
      });
      return;
    }

    try {
      await makeUserAdmin(user.id);
      toast({
        title: "Success",
        description: "You are now an admin",
      });
      // Force refresh the page to update the UI with new admin status
      window.location.reload();
    } catch (error) {
      console.error("Error making self admin:", error);
      toast({
        title: "Error",
        description: `Failed to update your role: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    }
  };

  const handleMakeAdminByEmail = async () => {
    if (!newAdminEmail) return;

    try {
      // First find the user by email
      const { data, error } = await supabase
        .from("users")
        .select("id")
        .eq("email", newAdminEmail)
        .single();

      if (error) {
        throw new Error("User not found");
      }

      await makeUserAdmin(data.id);
      // Update the local state
      setUsers(
        users.map((u) =>
          u.email === newAdminEmail ? { ...u, is_admin: true } : u,
        ),
      );
      setNewAdminEmail("");

      toast({
        title: "Success",
        description: `User ${newAdminEmail} has been made an admin`,
      });
    } catch (error) {
      console.error("Error making user admin by email:", error);
      toast({
        title: "Error",
        description: "Failed to find or update user",
        variant: "destructive",
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>
              You need admin privileges to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              If you should have admin access, you can make yourself an admin
              using the button below. This is only available during development.
            </p>
            <Button onClick={handleMakeCurrentUserAdmin} className="w-full">
              <Shield className="mr-2 h-4 w-4" />
              Make Myself Admin
            </Button>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="w-full"
            >
              Return to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

        <Tabs defaultValue="users">
          <TabsList className="mb-6">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage users and their roles in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Make User Admin</h3>
                  <div className="flex gap-2">
                    <Input
                      placeholder="User email"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                    />
                    <Button onClick={handleMakeAdminByEmail}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add Admin
                    </Button>
                  </div>
                </div>

                <div className="border rounded-md">
                  <div className="grid grid-cols-5 gap-4 p-4 font-medium border-b">
                    <div>Name</div>
                    <div>Email</div>
                    <div>Role</div>
                    <div>Company</div>
                    <div>Actions</div>
                  </div>

                  {loading ? (
                    <div className="p-4 text-center">Loading users...</div>
                  ) : users.length === 0 ? (
                    <div className="p-4 text-center">No users found</div>
                  ) : (
                    users.map((user) => (
                      <div
                        key={user.id}
                        className="grid grid-cols-5 gap-4 p-4 border-b last:border-0"
                      >
                        <div>{user.full_name || "N/A"}</div>
                        <div>{user.email}</div>
                        <div>
                          {user.is_admin ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Admin
                            </span>
                          ) : user.is_client ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Client
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              User
                            </span>
                          )}
                        </div>
                        <div>
                          {user.company_id ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                navigate(`/companies/${user.company_id}`)
                              }
                            >
                              View Company
                            </Button>
                          ) : (
                            "Not assigned"
                          )}
                        </div>
                        <div className="flex gap-2">
                          {!user.is_admin && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMakeAdmin(user.id)}
                            >
                              <Shield className="mr-2 h-3 w-3" />
                              Make Admin
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              navigate(`/admin/assign-company/${user.id}`)
                            }
                          >
                            {user.company_id
                              ? "Change Company"
                              : "Assign to Company"}
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  Configure global system settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  System settings will be implemented in a future update.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
