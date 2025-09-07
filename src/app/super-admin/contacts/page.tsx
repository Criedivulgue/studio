import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { contactsData, usersData } from "@/lib/data";
import { MoreHorizontal, Upload, Download, Search, Phone, MessageSquare, Link2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function SuperAdminContactsPage() {
  
  // O Super Admin vê todos os contatos.
  const allContacts = contactsData;
  const allUsers = usersData;

  const getUserById = (id: string) => allUsers.find(u => u.id === id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <header className="space-y-1.5">
          <h1 className="text-2xl font-headline font-semibold">Todos os Contatos</h1>
          <p className="text-muted-foreground">
            Gerencie toda a base de usuários do sistema.
          </p>
        </header>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Importar
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="font-headline">Contatos do Sistema</CardTitle>
              <CardDescription>
                Visão geral de todos os contatos no sistema.
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar contatos..." className="pl-8 sm:w-[300px]" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox />
                </TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Proprietário</TableHead>
                <TableHead>Link do Chat</TableHead>
                <TableHead><span className="sr-only">Ações</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allContacts.map((contact) => {
                const owner = getUserById(contact.ownerId);
                return (
                <TableRow key={contact.id}>
                  <TableCell>
                    <Checkbox />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={`https://picsum.photos/seed/${contact.id}/40/40`} data-ai-hint="profile picture" />
                        <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {contact.name}
                    </div>
                  </TableCell>
                  <TableCell>{contact.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{contact.group}</Badge>
                  </TableCell>
                  <TableCell>
                      <Badge variant="outline">{owner?.name || contact.ownerId}</Badge>
                  </TableCell>
                  <TableCell>
                     <Button variant="ghost" size="sm" asChild>
                        <Link href={`/chat/${contact.ownerId}`} target="_blank">
                           <Link2 className="mr-2 h-4 w-4" />
                           /chat/{contact.ownerId}
                        </Link>
                     </Button>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                        <DropdownMenuItem>Reatribuir</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
