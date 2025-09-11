'use client';

import React from 'react';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Contact, Tag, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react'; // Import Loader2 for a better loading experience

export default function SuperAdminDashboardPage() {
  const { dashboardData, loading, error, isSuperAdmin } = useSuperAdmin();

  // Loading state takes precedence
  if (loading) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-3">Carregando dashboard...</p>
      </div>
    );
  }
  
  // If not superadmin (and not loading), show access denied.
  if (!isSuperAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Acesso negado. Requer permissões de superadministrador.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // If there is an error (and not loading), show the error.
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar dados: {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Dashboard Super Admin</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contatos</CardTitle>
            <Contact className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalContacts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tags</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalTags}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Usuários Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.recentUsers.length > 0 ? (
              <div className="space-y-2">
                {dashboardData.recentUsers.map(user => (
                  <div key={user.id} className="flex justify-between items-center p-2 border rounded">
                    <span>{user.email}</span>
                    <span className="text-sm text-muted-foreground">{user.role}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum usuário encontrado</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contatos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.recentContacts.length > 0 ? (
              <div className="space-y-2">
                {dashboardData.recentContacts.map(contact => (
                  <div key={contact.id} className="p-2 border rounded">
                    <div className="font-medium">{contact.name}</div>
                    <div className="text-sm text-muted-foreground">{contact.email}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum contato encontrado</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}