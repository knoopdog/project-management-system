import React, { useState, useEffect } from 'react';
import { FolderOpen, ClipboardList, DollarSign, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { supabase } from '../../services/supabase';
import { Project, Task, ProjectStatus } from '../../types';
import format from 'date-fns/format';
import { useAuth } from '../../contexts/AuthContext';

const CustomerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<number>(0);
  const [tasks, setTasks] = useState<number>(0);
  const [totalHours, setTotalHours] = useState<number>(0);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
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

        // Fetch project count
        const { count: projectCount } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('customer_id', customerId);

        // Fetch projects with tasks
        const { data: projectsWithTasks } = await supabase
          .from('projects')
          .select(`
            *,
            tasks(*)
          `)
          .eq('customer_id', customerId);

        // Calculate task count, total hours and cost
        let taskCount = 0;
        let hours = 0;
        let cost = 0;

        if (projectsWithTasks) {
          projectsWithTasks.forEach(project => {
            if (project.tasks) {
              taskCount += project.tasks.length;
              project.tasks.forEach((task: any) => {
                hours += task.total_hours || 0;
                cost += task.total_cost || 0;
              });
            }
          });
        }

        // Fetch recent projects
        const { data: recentProjectsData } = await supabase
          .from('projects')
          .select('*')
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false })
          .limit(5);

        // Fetch recent tasks
        const { data: recentTasksData } = await supabase
          .from('tasks')
          .select(`
            *,
            project:projects(name)
          `)
          .in('project_id', projectsWithTasks?.map(p => p.id) || [])
          .order('created_at', { ascending: false })
          .limit(5);

        setProjects(projectCount || 0);
        setTasks(taskCount);
        setTotalHours(hours);
        setTotalCost(cost);
        setRecentProjects(recentProjectsData || []);
        setRecentTasks(recentTasksData || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const getStatusColor = (status: ProjectStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'not_started':
        return 'outline';
      case 'in_progress':
        return 'default';
      case 'waiting':
        return 'secondary';
      case 'completed':
        return 'default';
      default:
        return 'outline';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight mb-6">Dashboard</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="flex items-center gap-4">
            <Avatar size="lg">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <FolderOpen className="size-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="text-2xl font-semibold">{projects}</span>
              <p className="text-sm text-muted-foreground">Projekte</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <Avatar size="lg">
              <AvatarFallback className="bg-violet-600 text-white">
                <ClipboardList className="size-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="text-2xl font-semibold">{tasks}</span>
              <p className="text-sm text-muted-foreground">Aufgaben</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <Avatar size="lg">
              <AvatarFallback className="bg-amber-500 text-white">
                <Clock className="size-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="text-2xl font-semibold">{totalHours.toFixed(1)}</span>
              <p className="text-sm text-muted-foreground">Gesamtstunden</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <Avatar size="lg">
              <AvatarFallback className="bg-green-600 text-white">
                <DollarSign className="size-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="text-2xl font-semibold">{'\u20AC'}{totalCost.toFixed(2)}</span>
              <p className="text-sm text-muted-foreground">Gesamtkosten</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects and Tasks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Aktuelle Projekte</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent>
            <ul className="divide-y">
              {recentProjects.map((project: any) => (
                <li key={project.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <Avatar>
                    <AvatarFallback>
                      <FolderOpen className="size-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none truncate">{project.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Erstellt: {format(new Date(project.created_at), 'dd.MM.yyyy')}
                    </p>
                  </div>
                  <Badge
                    variant={getStatusColor(project.status)}
                    className={project.status === 'completed' ? 'bg-green-600 text-white hover:bg-green-600/90' : ''}
                  >
                    {getStatusLabel(project.status)}
                  </Badge>
                </li>
              ))}
              {recentProjects.length === 0 && (
                <li className="py-3">
                  <p className="text-sm text-muted-foreground">Keine Projekte gefunden</p>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aktuelle Aufgaben</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent>
            <ul className="divide-y">
              {recentTasks.map((task: any) => (
                <li key={task.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <Avatar>
                    <AvatarFallback>
                      <ClipboardList className="size-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none truncate">{task.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Projekt: {task.project?.name || 'Unbekannt'} | Stunden: {task.total_hours || 0} | Kosten: {'\u20AC'}{task.total_cost?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </li>
              ))}
              {recentTasks.length === 0 && (
                <li className="py-3">
                  <p className="text-sm text-muted-foreground">Keine Aufgaben gefunden</p>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerDashboardPage;
