import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  MessageSquare,
  Timer,
  CheckSquare,
  Loader2,
  Send,
  Play,
  Pause,
  Square,
  Clock,
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { Task, Project, ProjectStatus, Subtask, TimeEntry, Comment } from '../../types';
import { useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { useTimer, formatElapsedTime } from '../../hooks/use-timer';

const TasksPage: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const projectIdFromUrl = queryParams.get('project');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<{ id: string; company_name: string }[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projectIdFromUrl);
  const [tabValue, setTabValue] = useState('all');
  const [formData, setFormData] = useState({
    project_id: '',
    name: '',
    description: '',
  });

  // Subtasks state
  const [subtasksDialogOpen, setSubtasksDialogOpen] = useState(false);
  const [subtasksTaskId, setSubtasksTaskId] = useState<string | null>(null);
  const [subtasksTaskName, setSubtasksTaskName] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskName, setNewSubtaskName] = useState('');
  const [subtasksLoading, setSubtasksLoading] = useState(false);

  // Time entries state
  const [timeEntriesDialogOpen, setTimeEntriesDialogOpen] = useState(false);
  const [timeEntriesTaskId, setTimeEntriesTaskId] = useState<string | null>(null);
  const [timeEntriesTaskName, setTimeEntriesTaskName] = useState('');
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [timeEntriesLoading, setTimeEntriesLoading] = useState(false);
  const [timeEntryForm, setTimeEntryForm] = useState({
    start_time: '',
    end_time: '',
    hours: '',
    notes: '',
  });

  // Comments state
  const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);
  const [commentsTaskId, setCommentsTaskId] = useState<string | null>(null);
  const [commentsTaskName, setCommentsTaskName] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');

  // Timer
  const {
    timerState, displaySeconds, startTimer, pauseTimer, resumeTimer,
    stopTimer, discardTimer, isRunning, isPaused, isIdle,
  } = useTimer();
  const [stopTimerDialogOpen, setStopTimerDialogOpen] = useState(false);
  const [stopTimerNotes, setStopTimerNotes] = useState('');
  const [stopTimerData, setStopTimerData] = useState<{
    taskId: string; taskName: string; startedAt: string; endedAt: string; hours: number;
  } | null>(null);

  // Recent time entries for Time Tracking tab
  const [recentTimeEntries, setRecentTimeEntries] = useState<(TimeEntry & { task_name?: string })[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);

  // Edit time entry state
  const [editTimeEntryDialogOpen, setEditTimeEntryDialogOpen] = useState(false);
  const [editTimeEntryData, setEditTimeEntryData] = useState<{
    id: string;
    start_time: string;
    end_time: string;
    hours: string;
    notes: string;
  }>({ id: '', start_time: '', end_time: '', hours: '', notes: '' });

  // Recent comments for Comments tab
  const [recentComments, setRecentComments] = useState<(Comment & { task_name?: string })[]>([]);
  const [recentCommentsLoading, setRecentCommentsLoading] = useState(false);

  // Edit comment state
  const [editCommentDialogOpen, setEditCommentDialogOpen] = useState(false);
  const [editCommentData, setEditCommentData] = useState<{
    id: string;
    content: string;
  }>({ id: '', content: '' });

  useEffect(() => {
    fetchProjects();
    fetchCustomers();
  }, []);

  // Auto-select customer when arriving via URL parameter
  useEffect(() => {
    if (projectIdFromUrl && projects.length > 0) {
      const target = projects.find(p => p.id === projectIdFromUrl);
      if (target && target.customer_id) {
        setSelectedCustomerId(target.customer_id);
      }
    }
  }, [projectIdFromUrl, projects]);

  // Filter projects by selected customer
  const filteredProjectsByCustomer = selectedCustomerId === 'all'
    ? projects
    : projects.filter(p => p.customer_id === selectedCustomerId);

  useEffect(() => {
    if (filteredProjectsByCustomer.length > 0) {
      if (projectIdFromUrl && filteredProjectsByCustomer.some(p => p.id === projectIdFromUrl)) {
        setSelectedProjectId(projectIdFromUrl);
      } else if (!selectedProjectId || !filteredProjectsByCustomer.some(p => p.id === selectedProjectId)) {
        setSelectedProjectId(filteredProjectsByCustomer[0].id);
      }
    } else {
      setSelectedProjectId(null);
    }
  }, [filteredProjectsByCustomer.length, projects, projectIdFromUrl, selectedCustomerId]);

  useEffect(() => {
    if (selectedProjectId) {
      fetchTasks(selectedProjectId);
    }
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          customer_id,
          customer:customers(id, company_name)
        `)
        .order('name', { ascending: true });

      if (error) throw error;
      const mappedProjects = data ? data.map((p: any) => {
        let customerName = '';
        if (p.customer && Array.isArray(p.customer) && p.customer.length > 0) {
          customerName = p.customer[0].company_name;
        } else if (p.customer && typeof p.customer === 'object') {
          customerName = p.customer.company_name;
        }

        return {
          id: p.id,
          name: p.name,
          customer_id: p.customer_id,
          description: '',
          status: 'not_started' as ProjectStatus,
          total_hours: 0,
          total_cost: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          customer: { company_name: customerName }
        };
      }) : [];

      setProjects(mappedProjects as unknown as Project[]);
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, company_name')
        .order('company_name', { ascending: true });

      if (error) throw error;
      setCustomers(data || []);
    } catch (err: any) {
      console.error('Error fetching customers:', err);
    }
  };

  const fetchTasks = async (projectId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (mode: 'add' | 'edit', task?: Task) => {
    setDialogMode(mode);
    if (mode === 'edit' && task) {
      setSelectedTask(task);
      setFormData({
        project_id: task.project_id,
        name: task.name,
        description: task.description || '',
      });
    } else {
      setSelectedTask(null);
      setFormData({
        project_id: selectedProjectId || '',
        name: '',
        description: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSelectChange = (value: string) => {
    setFormData({
      ...formData,
      project_id: value,
    });
  };

  const handleProjectChange = (value: string) => {
    setSelectedProjectId(value);
  };

  const handleSubmit = async () => {
    try {
      if (dialogMode === 'add') {
        const { error } = await supabase.from('tasks').insert([
          {
            ...formData,
            total_hours: 0,
            total_cost: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);

        if (error) throw error;
      } else if (dialogMode === 'edit' && selectedTask) {
        const { error } = await supabase
          .from('tasks')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedTask.id);

        if (error) throw error;
      }

      if (selectedProjectId) {
        fetchTasks(selectedProjectId);
      }
      handleCloseDialog();
    } catch (err: any) {
      console.error('Error saving task:', err);
      setError(err.message);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Möchten Sie diese Aufgabe wirklich löschen?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      if (selectedProjectId) {
        fetchTasks(selectedProjectId);
      }
    } catch (err: any) {
      console.error('Error deleting task:', err);
      setError(err.message);
    }
  };

  // =================== SUBTASKS ===================
  const handleManageSubtasks = async (taskId: string, taskName: string) => {
    setSubtasksTaskId(taskId);
    setSubtasksTaskName(taskName);
    setSubtasksDialogOpen(true);
    setNewSubtaskName('');
    await fetchSubtasks(taskId);
  };

  const fetchSubtasks = async (taskId: string) => {
    setSubtasksLoading(true);
    try {
      const { data, error } = await supabase
        .from('subtasks')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setSubtasks(data || []);
    } catch (err: any) {
      console.error('Error fetching subtasks:', err);
    } finally {
      setSubtasksLoading(false);
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskName.trim() || !subtasksTaskId) return;
    try {
      const { error } = await supabase.from('subtasks').insert([{
        task_id: subtasksTaskId,
        name: newSubtaskName.trim(),
        completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }]);
      if (error) throw error;
      setNewSubtaskName('');
      await fetchSubtasks(subtasksTaskId);
    } catch (err: any) {
      console.error('Error adding subtask:', err);
      setError(err.message);
    }
  };

  const handleToggleSubtask = async (subtask: Subtask) => {
    try {
      const { error } = await supabase
        .from('subtasks')
        .update({ completed: !subtask.completed, updated_at: new Date().toISOString() })
        .eq('id', subtask.id);
      if (error) throw error;
      if (subtasksTaskId) await fetchSubtasks(subtasksTaskId);
    } catch (err: any) {
      console.error('Error toggling subtask:', err);
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      const { error } = await supabase.from('subtasks').delete().eq('id', subtaskId);
      if (error) throw error;
      if (subtasksTaskId) await fetchSubtasks(subtasksTaskId);
    } catch (err: any) {
      console.error('Error deleting subtask:', err);
    }
  };

  // =================== TIME ENTRIES ===================
  const calculateHoursFromTimes = (start: string, end: string): string => {
    if (!start || !end) return '';
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    if (diffMs <= 0) return '';
    return (diffMs / (1000 * 60 * 60)).toFixed(2);
  };

  const handleManageTimeEntries = async (taskId: string, taskName: string) => {
    setTimeEntriesTaskId(taskId);
    setTimeEntriesTaskName(taskName);
    setTimeEntriesDialogOpen(true);
    setTimeEntryForm({ start_time: '', end_time: '', hours: '', notes: '' });
    await fetchTimeEntries(taskId);
  };

  const fetchTimeEntries = async (taskId: string) => {
    setTimeEntriesLoading(true);
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('task_id', taskId)
        .order('start_time', { ascending: false });

      if (error) throw error;
      setTimeEntries(data || []);
    } catch (err: any) {
      console.error('Error fetching time entries:', err);
    } finally {
      setTimeEntriesLoading(false);
    }
  };

  const handleAddTimeEntry = async () => {
    if (!timeEntriesTaskId || !timeEntryForm.hours) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const hours = parseFloat(timeEntryForm.hours);
      const startTime = timeEntryForm.start_time || new Date().toISOString();
      const endTime = timeEntryForm.end_time || new Date().toISOString();

      const { error } = await supabase.from('time_entries').insert([{
        task_id: timeEntriesTaskId,
        admin_id: user.id,
        start_time: startTime,
        end_time: endTime,
        hours: hours,
        cost: 0,
        notes: timeEntryForm.notes || '',
        manual_entry: true,
        created_at: new Date().toISOString(),
      }]);
      if (error) throw error;
      setTimeEntryForm({ start_time: '', end_time: '', hours: '', notes: '' });
      await fetchTimeEntries(timeEntriesTaskId);
      if (selectedProjectId) fetchTasks(selectedProjectId);
    } catch (err: any) {
      console.error('Error adding time entry:', err);
      setError(err.message);
    }
  };

  const handleDeleteTimeEntry = async (entryId: string) => {
    try {
      const { error } = await supabase.from('time_entries').delete().eq('id', entryId);
      if (error) throw error;
      if (timeEntriesTaskId) await fetchTimeEntries(timeEntriesTaskId);
      if (selectedProjectId) fetchTasks(selectedProjectId);
    } catch (err: any) {
      console.error('Error deleting time entry:', err);
    }
  };

  // =================== COMMENTS ===================
  const handleManageComments = async (taskId: string, taskName: string) => {
    setCommentsTaskId(taskId);
    setCommentsTaskName(taskName);
    setCommentsDialogOpen(true);
    setNewComment('');
    await fetchComments(taskId);
  };

  const fetchComments = async (taskId: string) => {
    setCommentsLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (err: any) {
      console.error('Error fetching comments:', err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !commentsTaskId) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('comments').insert([{
        task_id: commentsTaskId,
        user_id: user.id,
        content: newComment.trim(),
        is_customer: false,
        admin_notified: false,
        created_at: new Date().toISOString(),
      }]);
      if (error) throw error;
      setNewComment('');
      await fetchComments(commentsTaskId);
    } catch (err: any) {
      console.error('Error adding comment:', err);
      setError(err.message);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase.from('comments').delete().eq('id', commentId);
      if (error) throw error;
      if (commentsTaskId) await fetchComments(commentsTaskId);
    } catch (err: any) {
      console.error('Error deleting comment:', err);
    }
  };

  // Timer handlers
  const handleTaskTimerToggle = (taskId: string, taskName: string) => {
    if (timerState.taskId === taskId && isRunning) {
      pauseTimer();
    } else if (timerState.taskId === taskId && isPaused) {
      resumeTimer();
    } else {
      handleStartTimer(taskId, taskName);
    }
  };

  const handleStartTimer = (taskId: string, taskName: string) => {
    if (!isIdle) {
      if (!window.confirm(`Timer läuft bereits für "${timerState.taskName}". Timer stoppen und neuen starten?`)) {
        return;
      }
      const result = stopTimer();
      if (result) {
        handleSaveTimerEntry(result.taskId, result.startedAt, result.endedAt, result.hours, '');
      }
    }
    startTimer(taskId, taskName);
  };

  const handleStopTimer = () => {
    const result = stopTimer();
    if (result) {
      setStopTimerData(result);
      setStopTimerNotes('');
      setStopTimerDialogOpen(true);
    }
  };

  const handleSaveTimerEntry = async (
    taskId: string, startedAt: string, endedAt: string, hours: number, notes: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error: insertError } = await supabase.from('time_entries').insert([{
        task_id: taskId,
        admin_id: user.id,
        start_time: startedAt,
        end_time: endedAt,
        hours,
        cost: 0,
        notes,
        manual_entry: false,
        created_at: new Date().toISOString(),
      }]);
      if (insertError) throw insertError;
      if (selectedProjectId) fetchTasks(selectedProjectId);
    } catch (err: any) {
      console.error('Error saving timer entry:', err);
      setError(err.message);
    }
  };

  const handleConfirmStopTimer = async () => {
    if (stopTimerData) {
      await handleSaveTimerEntry(
        stopTimerData.taskId, stopTimerData.startedAt, stopTimerData.endedAt,
        stopTimerData.hours, stopTimerNotes
      );
    }
    setStopTimerDialogOpen(false);
    setStopTimerData(null);
  };

  // Recent time entries for Time Tracking tab
  const fetchRecentProjectTimeEntries = async () => {
    if (tasks.length === 0) return;
    setRecentLoading(true);
    try {
      const taskIds = tasks.map((t) => t.id);
      const { data, error: fetchError } = await supabase
        .from('time_entries')
        .select('*')
        .in('task_id', taskIds)
        .order('start_time', { ascending: false })
        .limit(20);

      if (fetchError) throw fetchError;
      if (data) {
        const taskNameMap = new Map(tasks.map((t) => [t.id, t.name]));
        setRecentTimeEntries(
          data.map((e: any) => ({ ...e, task_name: taskNameMap.get(e.task_id) || '' }))
        );
      }
    } catch (err: any) {
      console.error('Error fetching recent time entries:', err);
    } finally {
      setRecentLoading(false);
    }
  };

  useEffect(() => {
    if (tabValue === 'time' && tasks.length > 0) {
      fetchRecentProjectTimeEntries();
    }
  }, [tabValue, tasks]);

  const handleEditTimeEntry = (entry: TimeEntry & { task_name?: string }) => {
    const toLocalDatetime = (iso: string) => {
      const d = new Date(iso);
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    setEditTimeEntryData({
      id: entry.id,
      start_time: entry.start_time ? toLocalDatetime(entry.start_time) : '',
      end_time: entry.end_time ? toLocalDatetime(entry.end_time) : '',
      hours: String(entry.hours),
      notes: entry.notes || '',
    });
    setEditTimeEntryDialogOpen(true);
  };

  const handleSaveEditTimeEntry = async () => {
    if (!editTimeEntryData.id || !editTimeEntryData.hours) return;
    try {
      const hours = parseFloat(editTimeEntryData.hours);
      if (isNaN(hours) || hours < 0) return;
      const updateData: Record<string, any> = {
        hours,
        notes: editTimeEntryData.notes,
      };
      if (editTimeEntryData.start_time) {
        updateData.start_time = new Date(editTimeEntryData.start_time).toISOString();
      }
      if (editTimeEntryData.end_time) {
        updateData.end_time = new Date(editTimeEntryData.end_time).toISOString();
      }
      const { error: updateError } = await supabase
        .from('time_entries')
        .update(updateData)
        .eq('id', editTimeEntryData.id);
      if (updateError) throw updateError;
      setEditTimeEntryDialogOpen(false);
      fetchRecentProjectTimeEntries();
      if (timeEntriesTaskId) fetchTimeEntries(timeEntriesTaskId);
      if (selectedProjectId) fetchTasks(selectedProjectId);
    } catch (err: any) {
      console.error('Error updating time entry:', err);
      setError(err.message);
    }
  };

  const handleDeleteRecentTimeEntry = async (entryId: string) => {
    try {
      const { error: deleteError } = await supabase.from('time_entries').delete().eq('id', entryId);
      if (deleteError) throw deleteError;
      fetchRecentProjectTimeEntries();
      if (selectedProjectId) fetchTasks(selectedProjectId);
    } catch (err: any) {
      console.error('Error deleting time entry:', err);
      setError(err.message);
    }
  };

  // Recent comments for Comments tab
  const fetchRecentProjectComments = async () => {
    if (tasks.length === 0) return;
    setRecentCommentsLoading(true);
    try {
      const taskIds = tasks.map((t) => t.id);
      const { data, error: fetchError } = await supabase
        .from('comments')
        .select('*')
        .in('task_id', taskIds)
        .order('created_at', { ascending: false })
        .limit(20);

      if (fetchError) throw fetchError;
      if (data) {
        const taskNameMap = new Map(tasks.map((t) => [t.id, t.name]));
        setRecentComments(
          data.map((c: any) => ({ ...c, task_name: taskNameMap.get(c.task_id) || '' }))
        );
      }
    } catch (err: any) {
      console.error('Error fetching recent comments:', err);
    } finally {
      setRecentCommentsLoading(false);
    }
  };

  useEffect(() => {
    if (tabValue === 'comments' && tasks.length > 0) {
      fetchRecentProjectComments();
    }
  }, [tabValue, tasks]);

  const handleEditComment = (comment: Comment & { task_name?: string }) => {
    setEditCommentData({
      id: comment.id,
      content: comment.content,
    });
    setEditCommentDialogOpen(true);
  };

  const handleSaveEditComment = async () => {
    if (!editCommentData.id || !editCommentData.content.trim()) return;
    try {
      const { error: updateError } = await supabase
        .from('comments')
        .update({ content: editCommentData.content.trim() })
        .eq('id', editCommentData.id);
      if (updateError) throw updateError;
      setEditCommentDialogOpen(false);
      fetchRecentProjectComments();
    } catch (err: any) {
      console.error('Error updating comment:', err);
      setError(err.message);
    }
  };

  // =================== INVOICED TOGGLE ===================
  const handleToggleInvoiced = async (taskId: string, currentValue: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ invoiced: !currentValue })
        .eq('id', taskId);
      if (updateError) throw updateError;
      if (selectedProjectId) fetchTasks(selectedProjectId);
    } catch (err: any) {
      console.error('Error toggling invoiced:', err);
      setError(err.message);
    }
  };

  const handleDeleteRecentComment = async (commentId: string) => {
    try {
      const { error: deleteError } = await supabase.from('comments').delete().eq('id', commentId);
      if (deleteError) throw deleteError;
      fetchRecentProjectComments();
    } catch (err: any) {
      console.error('Error deleting comment:', err);
      setError(err.message);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      task.name.toLowerCase().includes(searchLower) ||
      task.description?.toLowerCase().includes(searchLower)
    );
  });

  if (loading && projects.length === 0) {
    return (
      <div className="flex justify-center p-6">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Aufgaben</h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-[200px]">
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Kunde filtern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Kunden</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[250px]">
                <Select
                  value={selectedProjectId || ''}
                  onValueChange={handleProjectChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Projekt auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredProjectsByCustomer.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name} ({project.customer?.company_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={() => handleOpenDialog('add')}
              disabled={!selectedProjectId}
            >
              <Plus />
              Aufgabe hinzufügen
            </Button>
          </div>

          <Separator className="mb-4" />

          {/* Timer Bar */}
          {!isIdle && (
            <div className="mb-4 flex items-center justify-between rounded-lg border-2 border-primary/20 bg-primary/5 p-3">
              <div className="flex items-center gap-3">
                <Clock className={`size-5 text-primary ${isRunning ? 'animate-pulse' : ''}`} />
                <span className="font-medium text-sm">{timerState.taskName}</span>
                <Badge variant={isRunning ? 'default' : 'secondary'} className="font-mono text-sm px-3">
                  {formatElapsedTime(displaySeconds)}
                </Badge>
                {isPaused && (
                  <Badge variant="outline" className="text-xs">Pausiert</Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {isRunning ? (
                  <Button variant="outline" size="sm" onClick={pauseTimer}>
                    <Pause className="size-4 mr-1" /> Pause
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={resumeTimer}>
                    <Play className="size-4 mr-1" /> Fortsetzen
                  </Button>
                )}
                <Button size="sm" onClick={handleStopTimer}>
                  <Square className="size-4 mr-1" /> Stoppen
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={discardTimer}
                  className="text-destructive hover:text-destructive"
                  title="Verwerfen"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          )}

          <Tabs value={tabValue} onValueChange={setTabValue}>
            <TabsList>
              <TabsTrigger value="all">Alle Aufgaben</TabsTrigger>
              <TabsTrigger value="time">Zeiterfassung</TabsTrigger>
              <TabsTrigger value="comments">Kommentare</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="pt-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Aufgaben suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9"
                />
                {searchQuery && (
                  <button
                    type="button"
                    aria-label="clear search"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>

              {loading ? (
                <div className="flex justify-center p-6">
                  <Loader2 className="size-6 animate-spin" />
                </div>
              ) : filteredTasks.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aufgabe</TableHead>
                      <TableHead>Beschreibung</TableHead>
                      <TableHead>Stunden</TableHead>
                      <TableHead>Kosten</TableHead>
                      <TableHead>Rechnung</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="break-words whitespace-pre-wrap">{task.name}</TableCell>
                        <TableCell className="break-words whitespace-pre-wrap">{task.description}</TableCell>
                        <TableCell>{task.total_hours.toFixed(2)}</TableCell>
                        <TableCell>&euro;{task.total_cost.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={task.invoiced ? 'default' : 'outline'}
                            className={`cursor-pointer ${task.invoiced ? 'bg-green-600 hover:bg-green-600/80' : 'border-yellow-500 text-yellow-700 hover:bg-yellow-50'}`}
                            onClick={() => handleToggleInvoiced(task.id, task.invoiced)}
                          >
                            {task.invoiced ? 'Berechnet' : 'Offen'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleTaskTimerToggle(task.id, task.name)}
                              title={
                                timerState.taskId === task.id && isRunning
                                  ? 'Timer pausieren'
                                  : timerState.taskId === task.id && isPaused
                                    ? 'Timer fortsetzen'
                                    : 'Timer starten'
                              }
                              className={timerState.taskId === task.id && !isIdle ? 'text-primary' : ''}
                            >
                              {timerState.taskId === task.id && isRunning ? (
                                <Pause className="size-4" />
                              ) : timerState.taskId === task.id && isPaused ? (
                                <Play className="size-4 text-orange-500" />
                              ) : (
                                <Play className="size-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleManageSubtasks(task.id, task.name)}
                              title="Subtasks verwalten"
                            >
                              <CheckSquare className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleManageTimeEntries(task.id, task.name)}
                              title="Zeiteinträge verwalten"
                            >
                              <Timer className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleManageComments(task.id, task.name)}
                              title="Kommentare verwalten"
                            >
                              <MessageSquare className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog('edit', task)}
                              title="Aufgabe bearbeiten"
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTask(task.id)}
                              title="Aufgabe löschen"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  {searchQuery
                    ? 'Keine Aufgaben gefunden, die Ihren Suchkriterien entsprechen.'
                    : 'Keine Aufgaben vorhanden. Erstellen Sie Ihre erste Aufgabe über den Button oben.'}
                </p>
              )}
            </TabsContent>

            <TabsContent value="time" className="pt-4">
              <h3 className="text-lg font-semibold mb-3">Zeiterfassung</h3>

              {/* Active timer display */}
              {!isIdle && (
                <div className="mb-4 p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className={`size-4 text-primary ${isRunning ? 'animate-pulse' : ''}`} />
                    <span className="font-medium">Aktiver Timer: {timerState.taskName}</span>
                    {isPaused && <Badge variant="outline" className="text-xs">Pausiert</Badge>}
                  </div>
                  <p className="text-3xl font-mono font-medium">{formatElapsedTime(displaySeconds)}</p>
                </div>
              )}

              {/* Recent time entries for this project */}
              <p className="text-sm text-muted-foreground mb-3">
                Letzte Zeiteinträge für dieses Projekt:
              </p>
              {recentLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="size-5 animate-spin" />
                </div>
              ) : recentTimeEntries.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aufgabe</TableHead>
                      <TableHead>Datum</TableHead>
                      <TableHead className="w-20">Stunden</TableHead>
                      <TableHead>Notizen</TableHead>
                      <TableHead className="w-20">Typ</TableHead>
                      <TableHead className="w-20 text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTimeEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium text-sm">{entry.task_name}</TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {format(new Date(entry.start_time), 'dd.MM.yyyy HH:mm')}
                        </TableCell>
                        <TableCell className="font-medium">{entry.hours.toFixed(2)}h</TableCell>
                        <TableCell className="text-sm text-muted-foreground break-words whitespace-pre-wrap">{entry.notes}</TableCell>
                        <TableCell>
                          <Badge variant={entry.manual_entry ? 'outline' : 'secondary'} className="text-xs">
                            {entry.manual_entry ? 'Manuell' : 'Timer'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              onClick={() => handleEditTimeEntry(entry)}
                              title="Bearbeiten"
                            >
                              <Pencil className="size-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteRecentTimeEntry(entry.id)}
                              title="Löschen"
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  Noch keine Zeiteinträge vorhanden.
                </p>
              )}
            </TabsContent>

            <TabsContent value="comments" className="pt-4">
              <h3 className="text-lg font-semibold mb-3">Kommentare</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Letzte Kommentare für dieses Projekt:
              </p>
              {recentCommentsLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="size-5 animate-spin" />
                </div>
              ) : recentComments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aufgabe</TableHead>
                      <TableHead>Kommentar</TableHead>
                      <TableHead className="w-20">Autor</TableHead>
                      <TableHead className="w-36">Datum</TableHead>
                      <TableHead className="w-20 text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentComments.map((comment) => (
                      <TableRow key={comment.id}>
                        <TableCell className="font-medium text-sm">{comment.task_name}</TableCell>
                        <TableCell className="text-sm">{comment.content}</TableCell>
                        <TableCell>
                          <Badge variant={comment.is_customer ? 'outline' : 'secondary'} className="text-xs">
                            {comment.is_customer ? 'Kunde' : 'Admin'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {format(new Date(comment.created_at), 'dd.MM.yyyy HH:mm')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              onClick={() => handleEditComment(comment)}
                              title="Bearbeiten"
                            >
                              <Pencil className="size-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteRecentComment(comment.id)}
                              title="Löschen"
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  Noch keine Kommentare vorhanden.
                </p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add/Edit Task Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'add' ? 'Neue Aufgabe hinzufügen' : 'Aufgabe bearbeiten'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'add' ? 'Erstellen Sie eine neue Aufgabe für das Projekt' : 'Aufgabendetails bearbeiten'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="project-dialog-select">Projekt *</Label>
              <Select
                value={formData.project_id}
                onValueChange={handleSelectChange}
              >
                <SelectTrigger id="project-dialog-select" className="w-full">
                  <SelectValue placeholder="Projekt auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-name">Aufgabenname *</Label>
              <Input
                id="task-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-description">Beschreibung</Label>
              <Textarea
                id="task-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Abbrechen
            </Button>
            <Button onClick={handleSubmit}>
              {dialogMode === 'add' ? 'Aufgabe hinzufügen' : 'Änderungen speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subtasks Dialog */}
      <Dialog open={subtasksDialogOpen} onOpenChange={setSubtasksDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Subtasks - {subtasksTaskName}</DialogTitle>
            <DialogDescription>Teilaufgaben verwalten</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Neuer Subtask..."
                value={newSubtaskName}
                onChange={(e) => setNewSubtaskName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
              />
              <Button onClick={handleAddSubtask} size="icon">
                <Plus className="size-4" />
              </Button>
            </div>
            <Separator />
            {subtasksLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="size-5 animate-spin" />
              </div>
            ) : subtasks.length > 0 ? (
              <div className="space-y-1 max-h-[350px] overflow-y-auto pr-1">
                {subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center gap-3 p-2 rounded-md border bg-muted/30 hover:bg-muted/50">
                    <Checkbox
                      checked={subtask.completed}
                      onCheckedChange={() => handleToggleSubtask(subtask)}
                    />
                    <span className={`flex-1 text-sm ${subtask.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {subtask.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteSubtask(subtask.id)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-4 text-muted-foreground text-sm">Noch keine Subtasks vorhanden.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Time Entries Dialog */}
      <Dialog open={timeEntriesDialogOpen} onOpenChange={setTimeEntriesDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Zeiterfassung - {timeEntriesTaskName}</DialogTitle>
            <DialogDescription>Zeiteinträge für diese Aufgabe verwalten</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Startzeit</Label>
                  <Input
                    type="datetime-local"
                    value={timeEntryForm.start_time}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      const hours = calculateHoursFromTimes(newStart, timeEntryForm.end_time);
                      setTimeEntryForm({ ...timeEntryForm, start_time: newStart, ...(hours ? { hours } : {}) });
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Endzeit</Label>
                  <Input
                    type="datetime-local"
                    value={timeEntryForm.end_time}
                    onChange={(e) => {
                      const newEnd = e.target.value;
                      const hours = calculateHoursFromTimes(timeEntryForm.start_time, newEnd);
                      setTimeEntryForm({ ...timeEntryForm, end_time: newEnd, ...(hours ? { hours } : {}) });
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label>Stunden *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="z.B. 2.50"
                    value={timeEntryForm.hours}
                    onChange={(e) => setTimeEntryForm({ ...timeEntryForm, hours: e.target.value })}
                  />
                </div>
                <div className="col-span-3 space-y-1.5">
                  <Label>Notizen</Label>
                  <Input
                    placeholder="Woran wurde gearbeitet?"
                    value={timeEntryForm.notes}
                    onChange={(e) => setTimeEntryForm({ ...timeEntryForm, notes: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleAddTimeEntry} className="w-full">
                <Plus className="size-4" /> Zeiteintrag hinzufügen
              </Button>
            </div>
            <Separator />
            {timeEntriesLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="size-5 animate-spin" />
              </div>
            ) : timeEntries.length > 0 ? (
              <div className="max-h-[280px] overflow-y-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead className="w-20">Stunden</TableHead>
                      <TableHead>Notizen</TableHead>
                      <TableHead className="w-20 text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="text-sm whitespace-nowrap">
                          {format(new Date(entry.start_time), 'dd.MM.yyyy HH:mm')}
                        </TableCell>
                        <TableCell className="font-medium">{entry.hours.toFixed(2)}h</TableCell>
                        <TableCell className="text-sm text-muted-foreground break-words whitespace-pre-wrap">{entry.notes}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              onClick={() => handleEditTimeEntry(entry)}
                              title="Bearbeiten"
                            >
                              <Pencil className="size-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteTimeEntry(entry.id)}
                              title="Löschen"
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center py-4 text-muted-foreground text-sm">Noch keine Zeiteinträge vorhanden.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Comments Dialog */}
      <Dialog open={commentsDialogOpen} onOpenChange={setCommentsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Kommentare - {commentsTaskName}</DialogTitle>
            <DialogDescription>Kommentare zu dieser Aufgabe</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {commentsLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="size-5 animate-spin" />
              </div>
            ) : comments.length > 0 ? (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center justify-between mb-1.5">
                      <Badge variant={comment.is_customer ? 'outline' : 'secondary'} className="text-xs">
                        {comment.is_customer ? 'Kunde' : 'Admin'}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.created_at), 'dd.MM.yyyy HH:mm')}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-4 text-muted-foreground text-sm">Noch keine Kommentare vorhanden.</p>
            )}
            <Separator />
            <div className="flex gap-2">
              <Textarea
                placeholder="Kommentar schreiben..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={2}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
              />
              <Button onClick={handleAddComment} size="icon" className="self-end">
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Time Entry Dialog */}
      <Dialog open={editTimeEntryDialogOpen} onOpenChange={setEditTimeEntryDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Zeiteintrag bearbeiten</DialogTitle>
            <DialogDescription>Start- und Endzeit, Stunden und Notizen anpassen</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Startzeit</Label>
                <Input
                  type="datetime-local"
                  value={editTimeEntryData.start_time}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    const hours = calculateHoursFromTimes(newStart, editTimeEntryData.end_time);
                    setEditTimeEntryData({ ...editTimeEntryData, start_time: newStart, ...(hours ? { hours } : {}) });
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Endzeit</Label>
                <Input
                  type="datetime-local"
                  value={editTimeEntryData.end_time}
                  onChange={(e) => {
                    const newEnd = e.target.value;
                    const hours = calculateHoursFromTimes(editTimeEntryData.start_time, newEnd);
                    setEditTimeEntryData({ ...editTimeEntryData, end_time: newEnd, ...(hours ? { hours } : {}) });
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label>Stunden *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="z.B. 2.50"
                  value={editTimeEntryData.hours}
                  onChange={(e) => setEditTimeEntryData({ ...editTimeEntryData, hours: e.target.value })}
                />
              </div>
              <div className="col-span-3 space-y-1.5">
                <Label>Notizen</Label>
                <Input
                  placeholder="Woran wurde gearbeitet?"
                  value={editTimeEntryData.notes}
                  onChange={(e) => setEditTimeEntryData({ ...editTimeEntryData, notes: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTimeEntryDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveEditTimeEntry}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Comment Dialog */}
      <Dialog open={editCommentDialogOpen} onOpenChange={setEditCommentDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Kommentar bearbeiten</DialogTitle>
            <DialogDescription>Kommentartext anpassen</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Kommentar</Label>
              <Textarea
                value={editCommentData.content}
                onChange={(e) => setEditCommentData({ ...editCommentData, content: e.target.value })}
                rows={4}
                placeholder="Kommentar eingeben..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCommentDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveEditComment}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stop Timer Dialog */}
      <Dialog open={stopTimerDialogOpen} onOpenChange={setStopTimerDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Zeiteintrag speichern</DialogTitle>
            <DialogDescription>Timer-Ergebnis als Zeiteintrag speichern</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {stopTimerData && (
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Aufgabe</span>
                  <span className="font-medium">{stopTimerData.taskName}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start</span>
                  <span>{format(new Date(stopTimerData.startedAt), 'dd.MM.yyyy HH:mm')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ende</span>
                  <span>{format(new Date(stopTimerData.endedAt), 'dd.MM.yyyy HH:mm')}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dauer</span>
                  <span className="font-mono font-medium">{stopTimerData.hours.toFixed(2)} Stunden</span>
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Notizen (optional)</Label>
              <Textarea
                placeholder="Woran wurde gearbeitet?"
                value={stopTimerNotes}
                onChange={(e) => setStopTimerNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setStopTimerDialogOpen(false); setStopTimerData(null); }}>
              Verwerfen
            </Button>
            <Button onClick={handleConfirmStopTimer}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TasksPage;
