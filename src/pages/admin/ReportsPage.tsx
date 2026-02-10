import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Alert, AlertDescription } from '../../components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Separator } from '../../components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { supabase } from '../../services/supabase';

interface Customer {
  id: string;
  company_name: string;
}

interface Project {
  id: string;
  name: string;
  customer_id: string;
  total_hours?: number;
  total_cost?: number;
  customer?: {
    company_name: string;
  };
}

interface TaskInvoiceInfo {
  total_cost: number;
  invoiced: boolean;
  project_id: string;
}

interface ReportData {
  projects: Project[];
  total_hours: number;
  total_cost: number;
  invoiced_cost: number;
  not_invoiced_cost: number;
  projectInvoiceMap: Map<string, { invoiced: number; total: number }>;
}

const ReportsPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('all');
  const [reportData, setReportData] = useState<ReportData>({
    projects: [],
    total_hours: 0,
    total_cost: 0,
    invoiced_cost: 0,
    not_invoiced_cost: 0,
    projectInvoiceMap: new Map(),
  });

  useEffect(() => {
    fetchCustomers();
    generateReport();
  }, []);

  useEffect(() => {
    generateReport();
  }, [selectedCustomerId]);

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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);

      // Build query for projects
      let query = supabase
        .from('projects')
        .select(`
          id,
          name,
          customer_id,
          total_hours,
          total_cost,
          customer:customers(id, company_name)
        `);

      // Filter by customer if selected
      if (selectedCustomerId !== 'all') {
        query = query.eq('customer_id', selectedCustomerId);
      }

      // Get projects
      const { data: projects, error } = await query;

      if (error) throw error;

      // Calculate overall totals
      const totalHours = projects?.reduce((sum, project) => sum + (project.total_hours || 0), 0) || 0;
      const totalCost = projects?.reduce((sum, project) => sum + (project.total_cost || 0), 0) || 0;

      // Use a more aggressive type assertion with any
      const mappedProjects = projects ? projects.map((p: any) => {
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
          total_hours: p.total_hours,
          total_cost: p.total_cost,
          customer: { company_name: customerName }
        };
      }) : [];

      // Fetch tasks invoice data for the relevant projects
      const projectIds = mappedProjects.map((p: any) => p.id);
      let tasksQuery = supabase
        .from('tasks')
        .select('total_cost, invoiced, project_id');

      if (projectIds.length > 0) {
        tasksQuery = tasksQuery.in('project_id', projectIds);
      }

      const { data: tasksData } = await tasksQuery;

      const invoicedCost = tasksData?.filter(t => t.invoiced).reduce((sum, t) => sum + (t.total_cost || 0), 0) || 0;
      const notInvoicedCost = tasksData?.filter(t => !t.invoiced).reduce((sum, t) => sum + (t.total_cost || 0), 0) || 0;

      // Build per-project invoice map
      const projectInvoiceMap = new Map<string, { invoiced: number; total: number }>();
      tasksData?.forEach((t: any) => {
        const entry = projectInvoiceMap.get(t.project_id) || { invoiced: 0, total: 0 };
        entry.total++;
        if (t.invoiced) entry.invoiced++;
        projectInvoiceMap.set(t.project_id, entry);
      });

      setReportData({
        projects: mappedProjects,
        total_hours: totalHours,
        total_cost: totalCost,
        invoiced_cost: invoicedCost,
        not_invoiced_cost: notInvoicedCost,
        projectInvoiceMap,
      });
    } catch (err: any) {
      console.error('Error generating report:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerChange = (value: string) => {
    setSelectedCustomerId(value);
  };

  const handleExportPDF = () => {
    // Placeholder for PDF export functionality
    alert('PDF Export wird hier implementiert');
  };

  const handleExportExcel = () => {
    // Placeholder for Excel export functionality
    alert('Excel Export wird hier implementiert');
  };

  if (loading && customers.length === 0) {
    return (
      <div className="flex justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-4">
        Berichte
      </h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-xl border bg-card p-4 mb-6">
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div>
              <Select value={selectedCustomerId} onValueChange={handleCustomerChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Kunde" />
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleExportPDF}
                className="flex-1"
              >
                PDF exportieren
              </Button>
              <Button
                variant="outline"
                onClick={handleExportExcel}
                className="flex-1"
              >
                Excel exportieren
              </Button>
            </div>
          </div>
        </div>

        <Separator className="mb-6" />

        {loading ? (
          <div className="flex justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Zusammenfassung</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <p className="text-sm">
                    <strong>Gesamtstunden:</strong> {reportData.total_hours.toFixed(2)}
                  </p>
                  <p className="text-sm">
                    <strong>Gesamtkosten:</strong> &euro;{reportData.total_cost.toFixed(2)}
                  </p>
                  <p className="text-sm">
                    <strong>Projekte:</strong> {reportData.projects.length}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Rechnungsstatus</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <p className="text-sm">
                    <strong>Berechnet:</strong> &euro;{reportData.invoiced_cost.toFixed(2)}
                  </p>
                  <p className="text-sm">
                    <strong>Noch nicht berechnet:</strong> &euro;{reportData.not_invoiced_cost.toFixed(2)}
                  </p>
                  <p className="text-sm">
                    <strong>Gesamt:</strong> &euro;{(reportData.invoiced_cost + reportData.not_invoiced_cost).toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Projektdetails</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Projekt</TableHead>
                      <TableHead>Kunde</TableHead>
                      <TableHead>Stunden</TableHead>
                      <TableHead>Kosten</TableHead>
                      <TableHead>Rechnung</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.projects.map((project) => {
                      const invoiceInfo = reportData.projectInvoiceMap.get(project.id);
                      return (
                      <TableRow key={project.id}>
                        <TableCell>{project.name}</TableCell>
                        <TableCell>{project.customer?.company_name}</TableCell>
                        <TableCell>{project.total_hours?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>&euro;{project.total_cost?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>
                          {invoiceInfo ? `${invoiceInfo.invoiced}/${invoiceInfo.total} berechnet` : '0/0 berechnet'}
                        </TableCell>
                      </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
