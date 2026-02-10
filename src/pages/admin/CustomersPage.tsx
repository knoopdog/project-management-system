import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, X, Loader2 } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { supabase } from '../../services/supabase';
import { Customer } from '../../types';

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    company_name: '',
    first_name: '',
    last_name: '',
    address: '',
    email: '',
    hourly_rate: 0,
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
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

  const handleOpenDialog = (mode: 'add' | 'edit', customer?: Customer) => {
    setDialogMode(mode);
    if (mode === 'edit' && customer) {
      setSelectedCustomer(customer);
      setFormData({
        company_name: customer.company_name,
        first_name: customer.first_name,
        last_name: customer.last_name,
        address: customer.address,
        email: customer.email,
        hourly_rate: customer.hourly_rate,
      });
    } else {
      setSelectedCustomer(null);
      setFormData({
        company_name: '',
        first_name: '',
        last_name: '',
        address: '',
        email: '',
        hourly_rate: 0,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'hourly_rate' ? parseFloat(value) || 0 : value,
    });
  };

  const handleSubmit = async () => {
    try {
      if (dialogMode === 'add') {
        // Add new customer
        const { error } = await supabase.from('customers').insert([
          {
            ...formData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);

        if (error) throw error;
      } else if (dialogMode === 'edit' && selectedCustomer) {
        // Update existing customer
        const { error } = await supabase
          .from('customers')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedCustomer.id);

        if (error) throw error;
      }

      // Refresh customers list
      fetchCustomers();
      handleCloseDialog();
    } catch (err: any) {
      console.error('Error saving customer:', err);
      setError(err.message);
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!window.confirm('Möchten Sie diesen Kunden wirklich löschen?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);

      if (error) throw error;

      // Refresh customers list
      fetchCustomers();
    } catch (err: any) {
      console.error('Error deleting customer:', err);
      setError(err.message);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      customer.company_name.toLowerCase().includes(searchLower) ||
      customer.first_name.toLowerCase().includes(searchLower) ||
      customer.last_name.toLowerCase().includes(searchLower) ||
      customer.email.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Kunden</h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="relative w-[70%]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Kunden suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  aria-label="clear search"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button onClick={() => handleOpenDialog('add')}>
              <Plus className="h-4 w-4" />
              Kunde hinzufügen
            </Button>
          </div>

          <Separator className="mb-4" />

          {filteredCustomers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Firma</TableHead>
                  <TableHead>Kontakt</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Stundensatz</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>{customer.company_name}</TableCell>
                    <TableCell>
                      {customer.first_name} {customer.last_name}
                    </TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{'\u20AC'}{customer.hourly_rate.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog('edit', customer)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteCustomer(customer.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              {searchQuery
                ? 'Keine Kunden gefunden, die Ihren Suchkriterien entsprechen.'
                : 'Keine Kunden vorhanden. Fügen Sie Ihren ersten Kunden über den Button oben hinzu.'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Customer Dialog */}
      <Dialog open={openDialog} onOpenChange={(open) => { if (!open) handleCloseDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'add' ? 'Neuen Kunden hinzufügen' : 'Kunden bearbeiten'}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="space-y-4 mt-2"
          >
            <div className="space-y-2">
              <Label htmlFor="company_name">Firmenname</Label>
              <Input
                id="company_name"
                name="company_name"
                required
                value={formData.company_name}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="first_name">Vorname</Label>
              <Input
                id="first_name"
                name="first_name"
                required
                value={formData.first_name}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Nachname</Label>
              <Input
                id="last_name"
                name="last_name"
                required
                value={formData.last_name}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Textarea
                id="address"
                name="address"
                required
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hourly_rate">Stundensatz ({'\u20AC'})</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  {'\u20AC'}
                </span>
                <Input
                  id="hourly_rate"
                  name="hourly_rate"
                  type="number"
                  required
                  value={formData.hourly_rate}
                  onChange={handleInputChange}
                  className="pl-7"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Abbrechen
              </Button>
              <Button type="submit">
                {dialogMode === 'add' ? 'Kunde hinzufügen' : 'Änderungen speichern'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomersPage;
