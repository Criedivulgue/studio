import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { contactsData } from "@/lib/data";
import { MoreHorizontal, Upload, Download, Search, Phone, MessageSquare } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ContactsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <header className="space-y-1.5">
          <h1 className="text-2xl font-headline font-semibold">Contatos</h1>
          <p className="text-muted-foreground">
            Gerencie sua base de usuários e importe/exporte listas de contatos.
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
              <CardTitle className="font-headline">Todos os Contatos</CardTitle>
              <CardDescription>Uma lista de todos os usuários em seu sistema.</CardDescription>
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
                <TableHead>Telefone</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Suporte</TableHead>
                <TableHead><span className="sr-only">Ações</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contactsData.map((contact) => (
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
                  <TableCell>{contact.phone}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{contact.group}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Phone className="h-4 w-4" />
                        </Button>
                    </div>
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
                        <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
