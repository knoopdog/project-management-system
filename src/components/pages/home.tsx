import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronRight,
  ClipboardList,
  Settings,
  User,
  Users,
  BookOpen,
  BarChart,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../supabase/auth";

export default function LandingPage() {
  const { user, signOut, isClient } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Navigation */}
      <header className="fixed top-0 z-50 w-full bg-[rgba(255,255,255,0.8)] backdrop-blur-md border-b border-[#f5f5f7]/30">
        <div className="max-w-[980px] mx-auto flex h-12 items-center justify-between px-4">
          <div className="flex items-center">
            <Link to="/" className="font-medium text-xl">
              ProjectFlow
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center gap-4">
                <Link to={isClient ? "/client" : "/dashboard"}>
                  <Button
                    variant="ghost"
                    className="text-sm font-light hover:text-gray-500"
                  >
                    {isClient ? "Client Dashboard" : "Dashboard"}
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="h-8 w-8 hover:cursor-pointer">
                      <AvatarImage
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                        alt={user.email || ""}
                      />
                      <AvatarFallback>
                        {user.email?.[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="rounded-xl border-none shadow-lg"
                  >
                    <DropdownMenuLabel className="text-xs text-gray-500">
                      {user.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onSelect={() => signOut()}
                    >
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button
                    variant="ghost"
                    className="text-sm font-light hover:text-gray-500"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="rounded-full bg-black text-white hover:bg-gray-800 text-sm px-4">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="pt-12">
        {/* Hero section */}
        <section className="py-20 text-center">
          <h2 className="text-5xl font-semibold tracking-tight mb-1">
            ProjectFlow
          </h2>
          <h3 className="text-2xl font-medium text-gray-500 mb-4">
            Comprehensive project management for agencies and clients
          </h3>
          <div className="flex justify-center space-x-6 text-xl text-blue-600">
            <Link to="/" className="flex items-center hover:underline">
              Learn more <ChevronRight className="h-4 w-4" />
            </Link>
            <Link to="/signup" className="flex items-center hover:underline">
              Get started <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Features section */}
        <section className="py-20 bg-[#f5f5f7] text-center">
          <h2 className="text-5xl font-semibold tracking-tight mb-1">
            Key Features
          </h2>
          <h3 className="text-2xl font-medium text-gray-500 mb-4">
            Everything you need to manage projects efficiently
          </h3>
          <div className="mt-8 max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-2xl shadow-sm text-left">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="text-xl font-medium mb-2">Client Management</h4>
              <p className="text-gray-500">
                Easily manage clients, their details, and associated projects in
                one place.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm text-left">
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <ClipboardList className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="text-xl font-medium mb-2">Task Tracking</h4>
              <p className="text-gray-500">
                Track tasks with status updates, time recording, and cost
                calculation.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm text-left">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="text-xl font-medium mb-2">Knowledge Base</h4>
              <p className="text-gray-500">
                Create and share markdown articles with specific clients.
              </p>
            </div>
          </div>
        </section>

        {/* Grid section for other features */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3">
          <div className="bg-[#f5f5f7] rounded-3xl p-12 text-center">
            <h2 className="text-4xl font-semibold tracking-tight mb-1">
              Admin Dashboard
            </h2>
            <h3 className="text-xl font-medium text-gray-500 mb-4">
              Complete control over projects and clients
            </h3>
            <div className="mt-4 bg-white p-6 rounded-xl shadow-sm max-w-sm mx-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <span>Clients</span>
                  </div>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    12
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center">
                    <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                      <ClipboardList className="h-4 w-4 text-purple-600" />
                    </div>
                    <span>Projects</span>
                  </div>
                  <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                    24
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center">
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <BarChart className="h-4 w-4 text-green-600" />
                    </div>
                    <span>Reports</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-[#f5f5f7] rounded-3xl p-12 text-center">
            <h2 className="text-4xl font-semibold tracking-tight mb-1">
              Client Portal
            </h2>
            <h3 className="text-xl font-medium text-gray-500 mb-4">
              Transparent project visibility
            </h3>
            <div className="mt-4 bg-white p-6 rounded-xl shadow-sm max-w-sm mx-auto">
              <div className="space-y-4">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Website Redesign</span>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      In Progress
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: "45%" }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>Started: May 1</span>
                    <span>45% Complete</span>
                  </div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Marketing Campaign</span>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      Completed
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-green-600 h-2.5 rounded-full"
                      style={{ width: "100%" }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>Started: Apr 15</span>
                    <span>100% Complete</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to action */}
        <section className="py-20 text-center bg-black text-white">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-4xl font-semibold tracking-tight mb-4">
              Ready to streamline your project management?
            </h2>
            <p className="text-xl mb-8 text-gray-300">
              Join thousands of agencies and clients who use ProjectFlow to
              manage their projects efficiently.
            </p>
            <Link to="/signup">
              <Button className="rounded-full bg-white text-black hover:bg-gray-200 text-lg px-8 py-6">
                Get Started Today
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#f5f5f7] py-12 text-xs text-gray-500">
        <div className="max-w-[980px] mx-auto px-4">
          <div className="border-b border-gray-300 pb-8 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-medium text-sm text-gray-900 mb-4">
                ProjectFlow
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="hover:underline">
                    Features
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:underline">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:underline">
                    Case Studies
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:underline">
                    Testimonials
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-sm text-gray-900 mb-4">
                Resources
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="hover:underline">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:underline">
                    API Reference
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:underline">
                    Tutorials
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:underline">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-sm text-gray-900 mb-4">
                Company
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="hover:underline">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:underline">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:underline">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:underline">
                    Partners
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-sm text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="hover:underline">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:underline">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:underline">
                    Security
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:underline">
                    Compliance
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="py-4">
            <p>© 2025 ProjectFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
