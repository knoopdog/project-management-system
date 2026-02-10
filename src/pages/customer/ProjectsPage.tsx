import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Search, X, FolderOpen, Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { Project, ProjectStatus } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const ProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
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

        // Fetch projects with task counts
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select(`
            *,
            tasks:tasks(id, total_hours, total_cost)
          `)
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false });

        if (projectsError) throw projectsError;

        setProjects(projectsData || []);
      } catch (err: any) {
        console.error('Error fetching projects:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user]);

  const handleViewTasks = (projectId: string) => {
    navigate('/customer/tasks', { state: { projectId } });
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

  const getStatusClassName = (status: ProjectStatus) => {
    switch (status) {
      case 'not_started':
        return '';
      case 'in_progress':
        return 'bg-blue-600 text-white';
      case 'waiting':
        return 'border-yellow-500 text-yellow-700 bg-yellow-50';
      case 'completed':
        return 'bg-green-600 text-white';
      default:
        return '';
    }
  };

  const getProgressValue = (status: ProjectStatus) => {
    switch (status) {
      case 'not_started':
        return 0;
      case 'in_progress':
        return 50;
      case 'waiting':
        return 75;
      case 'completed':
        return 100;
      default:
        return 0;
    }
  };

  const filteredProjects = projects.filter((project) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      project.name.toLowerCase().includes(searchLower) ||
      project.description?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
      <h1 className="text-3xl font-bold tracking-tight mb-6">Meine Projekte</h1>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 mb-6">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Projekte suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                aria-label="clear search"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <Separator className="mb-4" />

        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredProjects.map((project) => {
              const taskCount = project.tasks?.length || 0;
              const totalHours = project.total_hours || 0;
              const totalCost = project.total_cost || 0;

              return (
                <Card key={project.id} className="flex flex-col">
                  <CardContent className="flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <h2 className="text-base font-semibold truncate max-w-[70%]">
                        {project.name}
                      </h2>
                      <Badge
                        variant={getStatusVariant(project.status)}
                        className={getStatusClassName(project.status)}
                      >
                        {getStatusLabel(project.status)}
                      </Badge>
                    </div>

                    <Progress
                      value={getProgressValue(project.status)}
                      className="mb-3 h-2"
                    />

                    <p className="text-sm text-muted-foreground mb-2">
                      {project.description?.substring(0, 100)}
                      {project.description && project.description.length > 100 ? '...' : ''}
                    </p>

                    <div className="mt-3 space-y-0.5">
                      <p className="text-sm">
                        <span className="font-semibold">Aufgaben:</span> {taskCount}
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold">Stunden:</span> {totalHours.toFixed(2)}
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold">Kosten:</span> &euro;{totalCost.toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewTasks(project.id)}
                    >
                      <FolderOpen className="h-4 w-4 mr-1" />
                      Aufgaben anzeigen
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="text-center py-8 text-muted-foreground">
            {searchQuery
              ? 'Keine Projekte gefunden, die Ihren Suchkriterien entsprechen.'
              : 'Keine Projekte vorhanden. Ihnen zugewiesene Projekte werden hier angezeigt.'}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProjectsPage;
