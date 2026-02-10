import React from "react";
import TopNavigation from "../dashboard/layout/TopNavigation";
import Sidebar from "../dashboard/layout/Sidebar";
import ProjectList from "../projects/ProjectList";

const Projects = () => {
  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <TopNavigation />
      <div className="flex h-[calc(100vh-64px)] mt-16">
        <Sidebar activeItem="Projects" />
        <main className="flex-1 overflow-auto p-6">
          <ProjectList />
        </main>
      </div>
    </div>
  );
};

export default Projects;
