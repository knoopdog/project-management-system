import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { timeEntryApi } from "@/lib/api";
import { TimeEntry } from "@/types/schema";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Clock, Trash2, Euro, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "../../../supabase/supabase";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface TimeEntryListProps {
  taskId: string;
  refreshTrigger?: number;
  hourlyRate?: number;
  isAdmin?: boolean;
}

interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_email?: string;
  is_admin?: boolean;
}

export default function TimeEntryList({
  taskId,
  refreshTrigger = 0,
  hourlyRate = 0,
  isAdmin = false,
}: TimeEntryListProps) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [totalDuration, setTotalDuration] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const fetchTimeEntries = async () => {
      setLoading(true);
      try {
        const entries = await timeEntryApi.getByTask(taskId);
        setTimeEntries(entries);

        // Calculate total duration and cost
        const totalSeconds = entries.reduce(
          (sum, entry) => sum + entry.duration,
          0,
        );
        setTotalDuration(totalSeconds);

        if (hourlyRate > 0) {
          const hours = totalSeconds / 3600;
          setTotalCost(hours * hourlyRate);
        }
      } catch (error) {
        console.error("Error fetching time entries:", error);
        toast({
          title: "Error",
          description: "Failed to load time entries. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTimeEntries();
  }, [taskId, refreshTrigger, hourlyRate]);

  useEffect(() => {
    const fetchComments = async () => {
      setLoadingComments(true);
      try {
        const { data: commentsData, error } = await supabase
          .from("task_comments")
          .select("*, users(email, is_admin)")
          .eq("task_id", taskId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (commentsData) {
          const formattedComments = commentsData.map((comment: any) => ({
            ...comment,
            user_email: comment.users?.email || "Unknown user",
            is_admin: comment.users?.is_admin || false,
          }));
          setComments(formattedComments);
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
        toast({
          title: "Error",
          description: "Failed to load comments. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoadingComments(false);
      }
    };

    const fetchCurrentUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          setCurrentUser(data.user);
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };

    fetchComments();
    fetchCurrentUser();
  }, [taskId]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const handleDelete = async (entryId: string) => {
    setDeleting(entryId);
    try {
      await timeEntryApi.delete(entryId);
      setTimeEntries(timeEntries.filter((entry) => entry.id !== entryId));
      toast({
        title: "Time entry deleted",
        description: "The time entry has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting time entry:", error);
      toast({
        title: "Error",
        description: "Failed to delete time entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !currentUser) return;

    setSubmittingComment(true);
    try {
      const { data, error } = await supabase
        .from("task_comments")
        .insert({
          task_id: taskId,
          user_id: currentUser.id,
          content: newComment.trim(),
        })
        .select("*, users(email, is_admin)");

      if (error) throw error;

      if (data && data[0]) {
        const newCommentData = {
          ...data[0],
          user_email: data[0].users?.email || "Unknown user",
          is_admin: data[0].users?.is_admin || false,
        };
        setComments([newCommentData, ...comments]);
        setNewComment("");
        toast({
          title: "Comment added",
          description: "Your comment has been added successfully.",
        });
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Time Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner />
            </div>
          ) : timeEntries.length > 0 ? (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Total Time
                    </h3>
                    <p className="text-lg font-mono">
                      {formatTime(totalDuration)}
                    </p>
                  </div>
                  {hourlyRate > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">
                        Total Cost
                      </h3>
                      <p className="text-lg flex items-center">
                        <Euro className="h-4 w-4 mr-1" />€{totalCost.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">Date</th>
                      <th className="text-left py-2 px-2">Duration</th>
                      <th className="text-left py-2 px-2">Notes</th>
                      <th className="text-right py-2 px-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timeEntries.map((entry) => (
                      <tr key={entry.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-2">
                          {formatDate(entry.created_at)}
                        </td>
                        <td className="py-3 px-2 font-mono">
                          {formatTime(entry.duration)}
                        </td>
                        <td className="py-3 px-2">{entry.notes || "-"}</td>
                        <td className="py-3 px-2 text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                disabled={deleting === entry.id}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete time entry?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will
                                  permanently delete the time entry.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(entry.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              No time entries recorded for this task yet.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="mr-2 h-5 w-5" />
            Task Comments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[100px]"
              />
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || submittingComment}
                className="w-full sm:w-auto"
              >
                {submittingComment ? "Submitting..." : "Add Comment"}
              </Button>
            </div>

            {loadingComments ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner />
              </div>
            ) : comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`p-4 rounded-lg border ${comment.is_admin ? "bg-blue-50" : "bg-gray-50"}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium flex items-center">
                        {comment.user_email}
                        {comment.is_admin && (
                          <Badge className="ml-2 bg-blue-100 text-blue-800">
                            Admin
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(comment.created_at)}
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap">{comment.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                No comments for this task yet.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
