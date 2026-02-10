import React from "react";
import ClientDashboard from "../client/ClientDashboard";
import { AuthProvider } from "../../../supabase/auth";

export default function ClientDashboardPage() {
  return (
    <AuthProvider>
      <ClientDashboard />
    </AuthProvider>
  );
}
