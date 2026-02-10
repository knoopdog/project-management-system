import React, { useState, useRef } from 'react';
import { Download, Upload, Loader2, CheckCircle2, AlertTriangle, FileUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { supabase } from '../../services/supabase';

interface BackupData {
  version: string;
  created_at: string;
  data: {
    customers: any[];
    projects: any[];
    tasks: any[];
    subtasks: any[];
    time_entries: any[];
    comments: any[];
  };
}

const TABLE_LABELS: Record<string, string> = {
  customers: 'Kunden',
  projects: 'Projekte',
  tasks: 'Aufgaben',
  subtasks: 'Subtasks',
  time_entries: 'Zeiteinträge',
  comments: 'Kommentare',
};

// Order matters: insert parents before children
const EXPORT_ORDER = ['customers', 'projects', 'tasks', 'subtasks', 'time_entries', 'comments'] as const;
// Delete children before parents
const DELETE_ORDER = ['comments', 'time_entries', 'subtasks', 'tasks', 'projects', 'customers'] as const;

const BackupPage: React.FC = () => {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<BackupData | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [progressTable, setProgressTable] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // =================== EXPORT ===================
  const handleExport = async () => {
    try {
      setExporting(true);
      setError(null);
      setSuccess(null);

      const backupData: BackupData = {
        version: '1.0',
        created_at: new Date().toISOString(),
        data: {
          customers: [],
          projects: [],
          tasks: [],
          subtasks: [],
          time_entries: [],
          comments: [],
        },
      };

      for (const table of EXPORT_ORDER) {
        setProgressTable(TABLE_LABELS[table]);
        const { data, error: fetchError } = await supabase
          .from(table)
          .select('*');

        if (fetchError) throw new Error(`Fehler beim Laden von ${TABLE_LABELS[table]}: ${fetchError.message}`);
        backupData.data[table] = data || [];
      }

      // Create and download file
      const json = JSON.stringify(backupData, null, 2);

      const now = new Date();
      const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
      const filename = `backup_${timestamp}.json`;

      // Try File System Access API first (native save dialog)
      if ('showSaveFilePicker' in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: filename,
            types: [{
              description: 'JSON Backup',
              accept: { 'application/json': ['.json'] },
            }],
          });
          const writable = await handle.createWritable();
          await writable.write(json);
          await writable.close();
        } catch (pickerErr: any) {
          // User cancelled the save dialog
          if (pickerErr.name === 'AbortError') {
            setExporting(false);
            setProgressTable(null);
            return;
          }
          throw pickerErr;
        }
      } else {
        // Fallback for browsers without File System Access API
        const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      const totalEntries = EXPORT_ORDER.reduce((sum, t) => sum + backupData.data[t].length, 0);
      setSuccess(`Backup erfolgreich erstellt: ${totalEntries} Einträge in ${filename}`);
    } catch (err: any) {
      console.error('Export error:', err);
      setError(err.message || 'Fehler beim Erstellen des Backups');
    } finally {
      setExporting(false);
      setProgressTable(null);
    }
  };

  // =================== IMPORT: FILE SELECT ===================
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccess(null);
    setImportPreview(null);

    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setError('Bitte eine .json-Datei auswählen');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);

        // Validate structure
        if (!parsed.version || !parsed.data) {
          setError('Ungültiges Backup-Format: "version" oder "data" fehlt');
          return;
        }

        const requiredTables = ['customers', 'projects', 'tasks', 'subtasks', 'time_entries', 'comments'];
        const missingTables = requiredTables.filter(t => !Array.isArray(parsed.data[t]));
        if (missingTables.length > 0) {
          setError(`Ungültiges Backup-Format: Fehlende Tabellen: ${missingTables.map(t => TABLE_LABELS[t] || t).join(', ')}`);
          return;
        }

        setImportPreview(parsed as BackupData);
      } catch {
        setError('Die Datei konnte nicht gelesen werden. Bitte eine gültige JSON-Datei auswählen.');
      }
    };
    reader.readAsText(file);
  };

  // =================== IMPORT: EXECUTE ===================
  const handleImport = async () => {
    if (!importPreview) return;

    try {
      setImporting(true);
      setConfirmDialogOpen(false);
      setError(null);
      setSuccess(null);

      // Step 1: Delete existing data (children first)
      for (const table of DELETE_ORDER) {
        setProgressTable(`${TABLE_LABELS[table]} löschen...`);
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

        if (deleteError) throw new Error(`Fehler beim Löschen von ${TABLE_LABELS[table]}: ${deleteError.message}`);
      }

      // Step 2: Insert backup data (parents first)
      for (const table of EXPORT_ORDER) {
        const rows = importPreview.data[table];
        if (rows.length === 0) continue;

        setProgressTable(`${TABLE_LABELS[table]} importieren (${rows.length})...`);

        // Insert in batches of 500
        const batchSize = 500;
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize);
          const { error: insertError } = await supabase
            .from(table)
            .insert(batch);

          if (insertError) throw new Error(`Fehler beim Importieren von ${TABLE_LABELS[table]}: ${insertError.message}`);
        }
      }

      const totalEntries = EXPORT_ORDER.reduce((sum, t) => sum + importPreview.data[t].length, 0);
      setSuccess(`Import erfolgreich: ${totalEntries} Einträge wiederhergestellt`);
      setImportPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error('Import error:', err);
      setError(err.message || 'Fehler beim Importieren des Backups');
    } finally {
      setImporting(false);
      setProgressTable(null);
    }
  };

  const totalPreviewEntries = importPreview
    ? EXPORT_ORDER.reduce((sum, t) => sum + importPreview.data[t].length, 0)
    : 0;

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Datensicherung</h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 border-green-500 text-green-700 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Backup erstellen
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-4">
              Erstellt eine JSON-Datei mit allen Datenbank-Einträgen (Kunden, Projekte, Aufgaben, Subtasks, Zeiteinträge, Kommentare).
            </p>

            {exporting && progressTable && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                Lade {progressTable}...
              </div>
            )}

            <Button onClick={handleExport} disabled={exporting || importing} className="w-full">
              {exporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Backup wird erstellt...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Backup herunterladen
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Import Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Backup importieren
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-4">
              Stellt Daten aus einer zuvor erstellten Backup-Datei wieder her. Bestehende Daten werden dabei ersetzt.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              disabled={importing}
              className="hidden"
            />
            <Button
              variant="outline"
              className="w-full mb-4"
              disabled={importing}
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp className="mr-2 h-4 w-4" />
              JSON-Datei auswählen
            </Button>

            {importPreview && (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Backup vom {new Date(importPreview.created_at).toLocaleString('de-DE')}
                </div>

                <div className="flex flex-wrap gap-2">
                  {EXPORT_ORDER.map((table) => (
                    <Badge key={table} variant="secondary">
                      {TABLE_LABELS[table]}: {importPreview.data[table].length}
                    </Badge>
                  ))}
                </div>

                <div className="text-sm font-medium">
                  Gesamt: {totalPreviewEntries} Einträge
                </div>

                {importing && progressTable && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {progressTable}
                  </div>
                )}

                <Button
                  onClick={() => setConfirmDialogOpen(true)}
                  disabled={importing || exporting}
                  variant="destructive"
                  className="w-full"
                >
                  {importing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Import läuft...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Backup wiederherstellen
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Backup wiederherstellen?</DialogTitle>
            <DialogDescription>
              Achtung: Alle bestehenden Daten werden gelöscht und durch die Daten aus dem Backup ersetzt. Dieser Vorgang kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm font-medium mb-2">Folgende Daten werden importiert:</p>
            <div className="flex flex-wrap gap-2">
              {importPreview && EXPORT_ORDER.map((table) => (
                <Badge key={table} variant="outline">
                  {TABLE_LABELS[table]}: {importPreview.data[table].length}
                </Badge>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button variant="destructive" onClick={handleImport}>
              Ja, wiederherstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BackupPage;
