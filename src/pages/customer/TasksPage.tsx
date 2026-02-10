import React, { useState, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { supabase } from '../../services/supabase';
import { Task, Project, ProjectStatus } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import TaskDetail from '../../components/customer/TaskDetail';

const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) return;

      try {
        // Get customer ID from user email
        const { data: customerData } = await supabase
          .from('customers')
          .select('id')
          .eq('email', user.email)
          .single();

        if (!customerData) {
          console.error('Customer not found');
          setLoading(false);
          return;
        }

        const customerId = customerData.id;

        // Fetch tasks with project info
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select(`
            *,
            project:projects(
              id,
              name,
              status,
              customer_id
            )
          `)
          .eq('project.customer_id', customerId)
          .order('created_at', { ascending: false });

        if (tasksError) throw tasksError;

        setTasks(tasksData || []);
      } catch (err: any) {
        console.error('Error fetching tasks:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [user]);

  const handleViewTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setTaskDetailOpen(true);
  };

  const handleCloseTaskDetail = () => {
    setTaskDetailOpen(false);
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

  const getStatusBadgeVariant = (status: ProjectStatus) => {
    switch (status) {
      case 'not_started':
        return 'secondary' as const;
      case 'in_progress':
        return 'default' as const;
      case 'waiting':
        return 'outline' as const;
      case 'completed':
        return 'default' as const;
      default:
        return 'secondary' as const;
    }
  };

  const getStatusBadgeClassName = (status: ProjectStatus) => {
    switch (status) {
      case 'waiting':
        return 'border-yellow-500 text-yellow-700 dark:text-yellow-400';
      case 'completed':
        return 'bg-green-600 text-white hover:bg-green-600/90';
      default:
        return '';
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      task.name.toLowerCase().includes(searchLower) ||
      task.description?.toLowerCase().includes(searchLower) ||
      task.project?.name.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center p-6">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Meine Aufgaben</h1>

      <Card className="mb-6">
        <CardContent>
          <div className="mb-4">
            <div className="relative">
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>

          <Separator className="mb-4" />

          {filteredTasks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aufgabe</TableHead>
                  <TableHead>Projekt</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stunden</TableHead>
                  <TableHead>Kosten</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>{task.name}</TableCell>
                    <TableCell>{task.project?.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusBadgeVariant(task.project?.status as ProjectStatus)}
                        className={getStatusBadgeClassName(task.project?.status as ProjectStatus)}
                      >
                        {getStatusLabel(task.project?.status as ProjectStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell>{task.total_hours.toFixed(2)}</TableCell>
                    <TableCell>{'\u20AC'}{task.total_cost.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewTask(task.id)}
                      >
                        Details anzeigen
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center py-8 text-muted-foreground">
              {searchQuery
                ? 'Keine Aufgaben gefunden, die Ihren Suchkriterien entsprechen.'
                : 'Keine Aufgaben vorhanden. Ihnen zugewiesene Aufgaben werden hier angezeigt.'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Task Detail Dialog */}
      <Dialog open={taskDetailOpen} onOpenChange={(open) => !open && handleCloseTaskDetail()}>
        <DialogContent className="sm:max-w-[768px]">
          {selectedTaskId && <TaskDetail taskId={selectedTaskId} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TasksPage;
