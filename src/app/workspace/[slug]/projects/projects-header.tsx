"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateProjectModal } from "@/features/tasks/components/create-project-modal";
import { useRouter } from "next/navigation";

export function ProjectsHeader({ workspaceId }: { workspaceId: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Projects</h1>
        <p className="text-zinc-400 mt-1">Manage your team's projects and tasks.</p>
      </div>
      <Button 
        onClick={() => setIsModalOpen(true)}
        className="bg-violet-600 hover:bg-violet-500 text-white gap-2"
      >
        <Plus size={16} />
        New Project
      </Button>

      <CreateProjectModal 
        workspaceId={workspaceId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={() => {
          setIsModalOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}
