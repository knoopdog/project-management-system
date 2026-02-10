import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/50">
      <Card className="w-[380px] max-w-[90%] shadow-sm">
        <CardContent className="p-6">
          {children}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthLayout;
