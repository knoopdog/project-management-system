import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Task, Subtask, Comment, TimeEntry, ProjectStatus } from '../../types';
import format from 'date-fns/format';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Checkbox } from '../ui/checkbox';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Label } from '../ui/label';
import { Loader2 } from 'lucide-react';

interface TaskDetailProps {
  taskId: string;
}

const TaskDetail: React.FC<TaskDetailProps> = ({ taskId }) => {
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        // Fetch task with project
        const { data: taskData, error: taskError } = await supabase
          .from('tasks')
          .select(`
            *,
            project:projects(
              name,
              status,
              customer_id
            )
          `)
          .eq('id', taskId)
          .single();

        if (taskError) throw taskError;

        // Fetch subtasks
        const { data: subtasksData, error: subtasksError } = await supabase
          .from('subtasks')
          .select('*')
          .eq('task_id', taskId)
          .order('created_at', { ascending: true });

        if (subtasksError) throw subtasksError;

        // Fetch time entries
        const { data: timeEntriesData, error: timeEntriesError } = await supabase
          .from('time_entries')
          .select('*')
          .eq('task_id', taskId)
          .order('start_time', { ascending: false });

        if (timeEntriesError) throw timeEntriesError;

        // Fetch comments with user info
        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select(`
            *,
            user:user_id(email)
          `)
          .eq('task_id', taskId)
          .order('created_at', { ascending: true });

        if (commentsError) throw commentsError;

        setTask(taskData);
        setSubtasks(subtasksData || []);
        setTimeEntries(timeEntriesData || []);
        setComments(commentsData || []);
      } catch (err: any) {
        console.error('Error fetching task details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (taskId) {
      fetchTaskDetails();
    }
  }, [taskId]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim() || !user) return;

    setCommentLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          task_id: taskId,
          user_id: user.id,
          content: newComment,
          is_customer: true,
        })
        .select(`
          *,
          user:user_id(email)
        `)
        .single();

      if (error) throw error;

      setComments([...comments, data]);
      setNewComment('');
    } catch (err: any) {
      console.error('Error adding comment:', err);
      setError(err.message);
    } finally {
      setCommentLoading(false);
    }
  };

  const getStatusLabel = (status: ProjectStatus) => {
    switch (status) {
      case 'not_started':
        return 'Nicht gestartet';
      case 'in_progress':
        return 'In Bearbeitung';
      case 'waiting':
        return 'Wartend';
      case 'completed':
        return 'Abgeschlossen';
      default:
        return 'Unbekannt';
    }
  };

  const getStatusVariant = (status: ProjectStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'not_started':
        return 'secondary';
      case 'in_progress':
        return 'default';
      case 'waiting':
        return 'outline';
      case 'completed':
        return 'default';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-6">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  if (!task) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Aufgabe nicht gefunden oder keine Berechtigung zur Ansicht.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Task Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{task.name}</h2>
            <Badge variant={getStatusVariant(task.project?.status as ProjectStatus)}>
              {getStatusLabel(task.project?.status as ProjectStatus)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Projekt: {task.project?.name}
          </p>
        </CardHeader>
        <CardContent>
          <Separator className="mb-4" />

          <p className="mb-4">
            {task.description || 'Keine Beschreibung vorhanden.'}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <Card>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">Gesamtstunden</p>
                <h3 className="text-lg font-semibold">{task.total_hours.toFixed(2)}</h3>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">Gesamtkosten</p>
                <h3 className="text-lg font-semibold">&euro;{task.total_cost.toFixed(2)}</h3>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Subtasks */}
      <Card>
        <CardHeader>
          <CardTitle>
            <h3 className="text-lg font-semibold">Subtasks</h3>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Separator className="mb-4" />

          {subtasks.length > 0 ? (
            <div className="space-y-3">
              {subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`subtask-${subtask.id}`}
                    checked={subtask.completed}
                    disabled
                  />
                  <Label
                    htmlFor={`subtask-${subtask.id}`}
                    className="cursor-default"
                  >
                    {subtask.name}
                  </Label>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Keine Subtasks für diese Aufgabe.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Time Entries */}
      <Card>
        <CardHeader>
          <CardTitle>
            <h3 className="text-lg font-semibold">Zeiteinträge</h3>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Separator className="mb-4" />

          {timeEntries.length > 0 ? (
            <div>
              {timeEntries.map((entry) => (
                <div key={entry.id} className="border-b py-3 last:border-b-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{entry.hours.toFixed(2)} Stunden</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      &euro;{entry.cost.toFixed(2)}
                    </span>
                  </div>
                  {entry.notes && (
                    <p className="text-sm mt-1">{entry.notes}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {entry.start_time ? format(new Date(entry.start_time), 'dd.MM.yyyy') : 'Manueller Eintrag'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Keine Zeiteinträge für diese Aufgabe.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Comments */}
      <Card>
        <CardHeader>
          <CardTitle>
            <h3 className="text-lg font-semibold">Kommentare</h3>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Separator className="mb-4" />

          {comments.length > 0 ? (
            <div>
              {comments.map((comment) => (
                <div key={comment.id} className="border-b py-3 last:border-b-0">
                  <span className="text-sm font-medium">
                    {comment.is_customer ? 'Sie' : comment.user?.email}
                  </span>
                  <p className="mt-1">{comment.content}</p>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(comment.created_at), 'dd.MM.yyyy HH:mm')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-6">
              Noch keine Kommentare.
            </p>
          )}

          {/* Add Comment Form */}
          <form onSubmit={handleCommentSubmit} className="mt-6">
            <Label className="mb-2">Kommentar hinzufügen</Label>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Textarea
              placeholder="Schreiben Sie hier Ihren Kommentar..."
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={commentLoading}
              className="mb-4"
            />

            <Button
              type="submit"
              disabled={!newComment.trim() || commentLoading}
            >
              {commentLoading ? <Loader2 className="size-4 animate-spin" /> : 'Kommentar senden'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskDetail;
