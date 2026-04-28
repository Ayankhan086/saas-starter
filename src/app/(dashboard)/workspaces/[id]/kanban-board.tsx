"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface Task {
  id: string;
  title: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  assignee: User | null;
}

interface KanbanBoardProps {
  workspaceId: string;
  initialTasks: Task[];
  users: User[];
}

export function KanbanBoard({ workspaceId, initialTasks, users }: KanbanBoardProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Quick Add State
  const [addingToColumn, setAddingToColumn] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const columns = [
    { id: "TODO", title: "To Do", color: "bg-slate-800", borderColor: "border-slate-700" },
    { id: "IN_PROGRESS", title: "In Progress", color: "bg-indigo-900/30", borderColor: "border-indigo-500/30" },
    { id: "DONE", title: "Done", color: "bg-emerald-900/30", borderColor: "border-emerald-500/30" },
  ];

  async function handleStatusChange(taskId: string, newStatus: string) {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus as any } : t))
    );

    try {
      await fetch(`/api/workspaces/${workspaceId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      router.refresh();
    } catch (err) {
      console.error(err);
      // Revert on error
      setTasks(initialTasks);
    }
  }

  async function handleAddTask(e: React.FormEvent, status: string) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTaskTitle }),
      });
      
      const newTask = await res.json();
      
      // If it wasn't added to TODO, immediately patch it to the target status
      if (status !== "TODO") {
        await fetch(`/api/workspaces/${workspaceId}/tasks/${newTask.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        newTask.status = status;
      }

      setTasks((prev) => [newTask, ...prev]);
      setAddingToColumn(null);
      setNewTaskTitle("");
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteTask(taskId: string) {
    if (!confirm("Delete this task?")) return;
    
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    
    try {
      await fetch(`/api/workspaces/${workspaceId}/tasks/${taskId}`, {
        method: "DELETE",
      });
      router.refresh();
    } catch (err) {
      setTasks(initialTasks);
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH": return "bg-red-500/10 text-red-400 border-red-500/20";
      case "MEDIUM": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "LOW": return "bg-slate-500/10 text-slate-400 border-slate-500/20";
      default: return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  return (
    <div className="flex h-full gap-6 overflow-x-auto pb-4 snap-x">
      {columns.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.id);

        return (
          <div
            key={col.id}
            className={`flex flex-col w-80 shrink-0 snap-center rounded-xl border ${col.borderColor} ${col.color} overflow-hidden`}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add("ring-2", "ring-indigo-500", "ring-opacity-50");
            }}
            onDragLeave={(e) => {
              e.currentTarget.classList.remove("ring-2", "ring-indigo-500", "ring-opacity-50");
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove("ring-2", "ring-indigo-500", "ring-opacity-50");
              if (draggedTaskId) {
                handleStatusChange(draggedTaskId, col.id);
                setDraggedTaskId(null);
              }
            }}
          >
            <div className="p-4 border-b border-inherit flex items-center justify-between bg-slate-900/20">
              <h3 className="font-semibold text-slate-200">{col.title}</h3>
              <span className="bg-slate-800/80 text-slate-400 text-xs font-medium px-2 py-1 rounded-full border border-slate-700">
                {columnTasks.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {columnTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => setDraggedTaskId(task.id)}
                  className="bg-slate-800 border border-slate-700 rounded-lg p-4 shadow-sm cursor-grab active:cursor-grabbing hover:border-slate-500 transition-colors group relative"
                >
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="absolute top-3 right-3 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  
                  <h4 className="text-sm font-medium text-white mb-3 pr-6">{task.title}</h4>
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    
                    {task.assignee ? (
                      <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-[10px] font-bold text-indigo-300" title={task.assignee.name || task.assignee.email}>
                        {(task.assignee.name || task.assignee.email).charAt(0).toUpperCase()}
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-[10px] text-slate-400" title="Unassigned">
                        ?
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {addingToColumn === col.id ? (
                <form onSubmit={(e) => handleAddTask(e, col.id)} className="bg-slate-800 border border-indigo-500/50 rounded-lg p-3 shadow-md">
                  <input
                    type="text"
                    autoFocus
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Task title..."
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-white mb-2 focus:outline-none focus:border-indigo-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setAddingToColumn(null)}
                      className="text-xs text-slate-400 hover:text-white px-2 py-1"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!newTaskTitle.trim()}
                      className="text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3 py-1 rounded"
                    >
                      Add
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => {
                    setAddingToColumn(col.id);
                    setNewTaskTitle("");
                  }}
                  className="w-full py-2.5 rounded-lg border border-dashed border-slate-700 text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 hover:border-slate-600 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Task
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
