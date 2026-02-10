import React, { useState, useEffect } from 'react';
import { FolderOpen, ClipboardList, Euro, CircleDollarSign, CircleCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { supabase } from '../../services/supabase';
import { Project, ProjectStatus } from '../../types';
import format from 'date-fns/format';

const DashboardPage: React.FC = () => {
  const [revenueInvoiced, setRevenueInvoiced] = useState<number>(0);
  const [revenueNotInvoiced, setRevenueNotInvoiced] = useState<number>(0);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch all tasks with invoiced status for revenue calculation
        const { data: tasksData } = await supabase
          .from('tasks')
          .select('total_cost, invoiced');

        const invoiced = tasksData?.filter(t => t.invoiced).reduce((sum, t) => sum + (t.total_cost || 0), 0) || 0;
        const notInvoiced = tasksData?.filter(t => !t.invoiced).reduce((sum, t) => sum + (t.total_cost || 0), 0) || 0;

        // Fetch recent projects
        const { data: recentProjectsData } = await supabase
          .from('projects')
          .select(`
            *,
            customer:customers(company_name)
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        // Fetch recent activity (comments, status changes, etc.)
        const { data: recentCommentsData } = await supabase
          .from('comments')
          .select(`
            *,
            task:tasks(name, project_id),
            user:users(email)
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        setRevenueInvoiced(invoiced);
        setRevenueNotInvoiced(notInvoiced);
        setRecentProjects(recentProjectsData || []);
        setRecentActivity(recentCommentsData || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight mb-6">Dashboard</h2>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="flex items-center gap-4">
            <Avatar size="lg">
              <AvatarFallback className="bg-amber-500 text-white">
                <CircleDollarSign className="size-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="text-2xl font-semibold">{'\u20AC'}{revenueNotInvoiced.toFixed(2)}</span>
              <p className="text-sm text-muted-foreground">Noch nicht berechnet</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <Avatar size="lg">
              <AvatarFallback className="bg-green-600 text-white">
                <CircleCheck className="size-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="text-2xl font-semibold">{'\u20AC'}{revenueInvoiced.toFixed(2)}</span>
              <p className="text-sm text-muted-foreground">Berechnet</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <Avatar size="lg">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Euro className="size-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="text-2xl font-semibold">{'\u20AC'}{(revenueInvoiced + revenueNotInvoiced).toFixed(2)}</span>
              <p className="text-sm text-muted-foreground">Gesamter Umsatz</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects and Activity */}
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
                      Kunde: {project.customer?.company_name || 'Unbekannt'}
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
            <CardTitle>Letzte Aktivitäten</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent>
            <ul className="divide-y">
              {recentActivity.map((activity: any) => (
                <li key={activity.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <Avatar>
                    <AvatarFallback>
                      <ClipboardList className="size-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none truncate">
                      Kommentar zu {activity.task?.name || 'Unbekannte Aufgabe'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {activity.user?.email || 'Unbekannter Benutzer'} -{' '}
                      {format(new Date(activity.created_at), 'dd.MM.yyyy')}
                    </p>
                  </div>
                </li>
              ))}
              {recentActivity.length === 0 && (
                <li className="py-3">
                  <p className="text-sm text-muted-foreground">Keine Aktivitäten vorhanden</p>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
