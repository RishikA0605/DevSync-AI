"use client";

import { useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { KanbanColumn } from "./kanban-column";
import { TaskCard, TaskCardData } from "./task-card";
import { TaskDetailSheet } from "./task-detail-sheet";
import { CreateTaskModal } from "./create-task-modal";
import { updateTaskStatus } from "@/features/tasks/actions/task.actions";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATUSES = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] as const;

interface Member {
  id: string;
  name: string | null;
  image: string | null;
}

interface Props {
  projectId: string;
  initialTasks: TaskCardData[];
  members: Member[];
}

export function KanbanBoard({ projectId, initialTasks, members }: Props) {
  const [tasks, setTasks] = useState<TaskCardData[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<TaskCardData | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskCardData | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find(t => t.id === event.active.id);
    if (task) setActiveTask(task);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as string;
    const task = tasks.find(t => t.id === taskId);

    if (!task || task.status === newStatus) return;

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    try {
      const updated = await updateTaskStatus(taskId, newStatus);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updated } : t));
      if (selectedTask?.id === taskId) setSelectedTask(prev => prev ? { ...prev, status: newStatus } : null);
    } catch {
      // Revert on error
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: task.status } : t));
    }
  }

  function handleTaskClick(task: TaskCardData) {
    setSelectedTask(task);
  }

  function handleTaskUpdate(updatedTask: TaskCardData) {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    setSelectedTask(updatedTask);
  }

  function handleTaskDeleted(taskId: string) {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setSelectedTask(null);
  }

  function handleTaskCreated(task: TaskCardData) {
    setTasks(prev => [...prev, task]);
  }

  return (
    <>
      <div className="flex items-center justify-end mb-6">
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-violet-600 hover:bg-violet-500 text-foreground dark:text-white gap-2"
          size="sm"
        >
          <Plus size={15} />
          Add Task
        </Button>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 h-full">
          {STATUSES.map(status => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasks.filter(t => t.status === status)}
              onTaskClick={handleTaskClick}
              onAddTask={status === "TODO" ? () => setIsCreateOpen(true) : undefined}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="opacity-90 rotate-1">
              <TaskCard task={activeTask} onClick={() => {}} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Task Detail Sheet */}
      {selectedTask && (
        <TaskDetailSheet
          task={selectedTask}
          members={members}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDeleted}
        />
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        projectId={projectId}
        members={members}
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(t) => handleTaskCreated({
          ...t,
          assignee: members.find(m => m.id === t.assigneeId) || null,
          comments: [],
        } as TaskCardData)}
      />
    </>
  );
}
