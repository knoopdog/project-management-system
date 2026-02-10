import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useNavigate } from 'react-router-dom';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError('Bitte geben Sie Ihre E-Mail-Adresse ein');
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
      console.error('Password reset error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <h1 className="text-center text-2xl font-semibold">Passwort zurücksetzen</h1>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success ? (
        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              Anweisungen zum Zurücksetzen des Passworts wurden an Ihre E-Mail gesendet.
            </AlertDescription>
          </Alert>
          <Button className="w-full" onClick={() => navigate('/login')}>
            Zurück zur Anmeldung
          </Button>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen Anweisungen zum Zurücksetzen Ihres Passworts.
          </p>

          <div className="space-y-2">
            <Label htmlFor="email">E-Mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Anweisungen senden
          </Button>

          <div className="text-center">
            <a
              href="/login"
              className="text-xs text-muted-foreground hover:underline"
            >
              Zurück zur Anmeldung
            </a>
          </div>
        </>
      )}
    </form>
  );
};

export default ForgotPasswordPage;
