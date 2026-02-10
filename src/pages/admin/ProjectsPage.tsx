import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, X, ClipboardList, Loader2 } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '../../services/supabase';
import { Project, ProjectStatus, Customer } from '../../types';
import { useNavigate } from 'react-router-dom';

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    name: '',
    description: '',
    status: 'not_started' as ProjectStatus,
  });

  useEffect(() => {
    fetchProjects();
    fetchCustomers();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          customer:customers(id, company_name, hourly_rate)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
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
        .select('*')
        .order('company_name', { ascending: true });

      if (error) throw error;
      setCustomers(data || []);
    } catch (err: any) {
      console.error('Error fetching customers:', err);
    }
  };

  const handleOpenDialog = (mode: 'add' | 'edit', project?: Project) => {
    setDialogMode(mode);
    if (mode === 'edit' && project) {
      setSelectedProject(project);
      setFormData({
        customer_id: project.customer_id,
        name: project.name,
        description: project.description || '',
        status: project.status,
      });
    } else {
      setSelectedProject(null);
      setFormData({
        customer_id: customers.length > 0 ? customers[0].id : '',
        name: '',
        description: '',
        status: 'not_started',
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

  const handleSubmit = async () => {
    try {
      if (dialogMode === 'add') {
        // Add new project
        const { error } = await supabase.from('projects').insert([
          {
            ...formData,
            total_hours: 0,
            total_cost: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);

        if (error) throw error;
      } else if (dialogMode === 'edit' && selectedProject) {
        // Update existing project
        const { error } = await supabase
          .from('projects')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedProject.id);

        if (error) throw error;
      }

      // Refresh projects list
      fetchProjects();
      handleCloseDialog();
    } catch (err: any) {
      console.error('Error saving project:', err);
      setError(err.message);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm('Möchten Sie dieses Projekt wirklich löschen?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      // Refresh projects list
      fetchProjects();
    } catch (err: any) {
      console.error('Error deleting project:', err);
      setError(err.message);
    }
  };

  const handleViewTasks = (projectId: string) => {
    navigate(`/admin/tasks?project=${projectId}`);
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

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'not_started':
        return <Badge variant="outline">{getStatusLabel(status)}</Badge>;
      case 'in_progress':
        return <Badge variant="default">{getStatusLabel(status)}</Badge>;
      case 'waiting':
        return <Badge variant="secondary">{getStatusLabel(status)}</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-600 hover:bg-green-600/90">{getStatusLabel(status)}</Badge>;
      default:
        return <Badge variant="outline">{getStatusLabel(status)}</Badge>;
    }
  };

  const filteredProjects = projects.filter((project) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      project.name.toLowerCase().includes(searchLower) ||
      project.description?.toLowerCase().includes(searchLower) ||
      project.customer?.company_name.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center p-6">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Projekte</h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="relative w-[70%]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Projekte suchen..."
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
            <Button
              onClick={() => handleOpenDialog('add')}
              disabled={customers.length === 0}
            >
              <Plus />
              Projekt hinzufügen
            </Button>
          </div>

          {customers.length === 0 && (
            <Alert className="mb-4">
              <AlertDescription>
                Sie müssen zuerst Kunden hinzufügen, bevor Sie Projekte erstellen können.
              </AlertDescription>
            </Alert>
          )}

          <Separator className="mb-4" />

          {filteredProjects.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projektname</TableHead>
                  <TableHead>Kunde</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stunden</TableHead>
                  <TableHead>Kosten</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>{project.name}</TableCell>
                    <TableCell>{project.customer?.company_name}</TableCell>
                    <TableCell>
                      {getStatusBadge(project.status)}
                    </TableCell>
                    <TableCell>{project.total_hours.toFixed(1)}</TableCell>
                    <TableCell>{'\u20AC'}{project.total_cost.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewTasks(project.id)}
                          title="Aufgaben anzeigen"
                        >
                          <ClipboardList className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog('edit', project)}
                          title="Projekt bearbeiten"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteProject(project.id)}
                          title="Projekt löschen"
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
                ? 'Keine Projekte gefunden, die Ihren Suchkriterien entsprechen.'
                : 'Keine Projekte vorhanden. Erstellen Sie Ihr erstes Projekt über den Button oben.'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Project Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'add' ? 'Neues Projekt hinzufügen' : 'Projekt bearbeiten'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="customer-select">Kunde *</Label>
              <Select
                value={formData.customer_id}
                onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
              >
                <SelectTrigger id="customer-select" className="w-full">
                  <SelectValue placeholder="Kunde auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project-name">Projektname *</Label>
              <Input
                id="project-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project-description">Beschreibung</Label>
              <Textarea
                id="project-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status-select">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as ProjectStatus })}
              >
                <SelectTrigger id="status-select" className="w-full">
                  <SelectValue placeholder="Status auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Nicht gestartet</SelectItem>
                  <SelectItem value="in_progress">In Bearbeitung</SelectItem>
                  <SelectItem value="waiting">Wartend</SelectItem>
                  <SelectItem value="completed">Abgeschlossen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Abbrechen
            </Button>
            <Button onClick={handleSubmit}>
              {dialogMode === 'add' ? 'Projekt hinzufügen' : 'Änderungen speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectsPage;
