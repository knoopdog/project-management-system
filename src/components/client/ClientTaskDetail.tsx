import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  ArrowLeft,
  Clock,
  DollarSign,
  MessageSquare,
  Send,
} from "lucide-react";
import { taskApi, projectApi, timeEntryApi } from "@/lib/api";
import { Task, Project, TimeEntry } from "@/types/schema";
import { useAuth } from "../../../supabase/auth";
import { supabase } from "../../../supabase/supabase";
import { toast } from "@/components/ui/use-toast";

interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

export default function ClientTaskDetail() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [totalTime, setTotalTime] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    const fetchTaskDetails = async () => {
      if (!taskId) return;

      try {
        // Fetch task details
        const taskData = await taskApi.getById(taskId);
        setTask(taskData);

        // Fetch project if task has project_id
        if (taskData.project_id) {
          const projectData = await projectApi.getById(taskData.project_id);
          setProject(projectData);
        }

        // Fetch time entries for this task
        const timeEntriesData = await timeEntryApi.getByTask(taskId);
        setTimeEntries(timeEntriesData);

        // Calculate total time and cost
        const totalSeconds = timeEntriesData.reduce(
          (sum, entry) => sum + entry.duration,
          0,
        );
        setTotalTime(totalSeconds);

        const hourlyRate =
          taskData.hourly_rate || projectData?.hourly_rate || 0;
        const cost = (totalSeconds / 3600) * hourlyRate;
        setTotalCost(cost);

        // Fetch comments for this task
        await fetchComments(taskId);
      } catch (error) {
        console.error("Error fetching task details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTaskDetails();
  }, [taskId]);

  const fetchComments = async (taskId: string) => {
    try {
      // Check if the task_comments table exists, if not create it
      const { data: tableExists } = await supabase
        .from("task_comments")
        .select("id")
        .limit(1);

      if (tableExists === null) {
        // Table doesn't exist yet, we'll create it when the first comment is added
        setComments([]);
        return;
      }

      // Fetch comments for this task
      const { data, error } = await supabase
        .from("task_comments")
        .select("*, users(email, full_name)")
        .eq("task_id", taskId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Format the comments with user information
      const formattedComments = data.map((comment) => ({
        ...comment,
        user_email: comment.users?.email,
        user_name: comment.users?.full_name,
      }));

      setComments(formattedComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleAddComment = async () => {
    if (!taskId || !user || !newComment.trim()) return;

    setSubmitting(true);
    try {
      // Check if the task_comments table exists, if not create it
      const { data: tableExists } = await supabase
        .from("task_comments")
        .select("id")
        .limit(1);

      if (tableExists === null) {
        // Create the task_comments table
        await supabase.rpc("create_task_comments_table");
      }

      // Add the comment
      const { data, error } = await supabase
        .from("task_comments")
        .insert({
          task_id: taskId,
          user_id: user.id,
          content: newComment.trim(),
        })
        .select("*, users(email, full_name)");

      if (error) throw error;

      // Add the new comment to the list
      if (data && data[0]) {
        const newCommentData = {
          ...data[0],
          user_email: data[0].users?.email || user.email,
          user_name: data[0].users?.full_name || "You",
        };
        setComments([...comments, newCommentData]);
      }

      // Clear the input
      setNewComment("");
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully.",
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Incoming":
        return <Badge variant="outline">Incoming</Badge>;
      case "In Progress":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            In Progress
          </Badge>
        );
      case "Completed":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Completed
          </Badge>
        );
      case "Invoiced":
        return (
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            Invoiced
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate("/client")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <div className="text-center mt-8">
          <p className="text-lg text-gray-500">
            Task not found or you don't have access to it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Button
        variant="ghost"
        onClick={() =>
          task.project_id
            ? navigate(`/client/projects/${task.project_id}`)
            : navigate("/client")
        }
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {task.project_id ? "Back to Project" : "Back to Dashboard"}
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">{task.name}</CardTitle>
            {project && (
              <p className="text-sm text-gray-500">Project: {project.name}</p>
            )}
          </div>
          <div>{getStatusBadge(task.status)}</div>
        </CardHeader>
        <CardContent className="space-y-6">
          {task.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Description
              </h3>
              <p className="text-gray-700">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gray-50 border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-gray-500 mr-2" />
                    <h3 className="font-medium">Total Time</h3>
                  </div>
                  <span className="text-lg font-semibold">
                    {formatTime(totalTime)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-50 border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-gray-500 mr-2" />
                    <h3 className="font-medium">Total Cost</h3>
                  </div>
                  <span className="text-lg font-semibold">
                    ${totalCost.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-50 border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-gray-500 mr-2" />
                    <h3 className="font-medium">Hourly Rate</h3>
                  </div>
                  <span className="text-lg font-semibold">
                    $
                    {task.hourly_rate
                      ? task.hourly_rate.toFixed(2)
                      : project?.hourly_rate
                        ? project.hourly_rate.toFixed(2)
                        : "0.00"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Time Entries */}
          <div>
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Time Entries
            </h3>

            {timeEntries.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No time entries recorded for this task yet.
              </p>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Date
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Duration
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {timeEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(entry.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                          {formatTime(entry.duration)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {entry.notes || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div>
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <MessageSquare className="mr-2 h-5 w-5" />
              Comments
            </h3>

            <div className="space-y-4 mb-4">
              {comments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">
                        {comment.user_name || comment.user_email || "User"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(comment.created_at)}
                      </div>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-end gap-2">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim() || submitting}
                className="flex-shrink-0"
              >
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
