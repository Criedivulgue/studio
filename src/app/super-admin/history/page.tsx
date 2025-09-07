"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { interactionsData, contactsData, usersData } from "@/lib/data";
import { MessageSquare, Phone, Mail } from "lucide-react";

export default function HistoryPage() {

  const getContactById = (id: string) => contactsData.find(c => c.id === id);
  const getAdminById = (id: string) => usersData.find(u => u.id === id);

  const interactionIcons = {
    Chat: <MessageSquare className="h-4 w-4" />,
    Ligação: <Phone className="h-4 w-4" />,
    Email: <Mail className="h-4 w-4" />,
  }

  return (
    <div className="space-y-6">
       <header className="space-y-1.5">
          <h1 className="text-2xl font-headline font-semibold">Histórico de Interações</h1>
          <p className="text-muted-foreground">
            Um registro de todas as interações com os contatos no sistema.
          </p>
        </header>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Últimas Atividades</CardTitle>
                <CardDescription>Visão geral de todos os pontos de contato.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Contato</TableHead>
                            <TableHead>Administrador</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Detalhes</TableHead>
                            <TableHead>Data</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {interactionsData.map((interaction) => {
                            const contact = getContactById(interaction.contactId);
                            const admin = getAdminById(interaction.adminId);
                            return (
                                <TableRow key={interaction.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={`https://picsum.photos/seed/${contact?.id}/40/40`} data-ai-hint="profile picture" />
                                                <AvatarFallback>{contact?.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{contact?.name || 'N/A'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{admin?.name || 'N/A'}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {interactionIcons[interaction.type]}
                                            <span>{interaction.type}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{interaction.notes}</TableCell>
                                    <TableCell className="text-muted-foreground">{new Date(interaction.timestamp).toLocaleString('pt-BR')}</TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
