import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MoreHorizontal, PlusCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Dados de exemplo para usuários
const users = [
    { id: '1', name: 'Super Admin', email: 'admin@omniflow.ai', role: 'Super Admin', avatar: 'https://picsum.photos/seed/admin/40/40' },
    { id: '2', name: 'Admin Vendas', email: 'vendas@omniflow.ai', role: 'Admin', avatar: 'https://picsum.photos/seed/admin-vendas/40/40' },
    { id: '3', name: 'Admin Suporte', email: 'suporte@omniflow.ai', role: 'Admin', avatar: 'https://picsum.photos/seed/admin-suporte/40/40' }
]

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <header className="space-y-1.5">
          <h1 className="text-2xl font-headline font-semibold">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground">
            Adicione, edite ou remova administradores do sistema.
          </p>
        </header>
        <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Usuário
        </Button>
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="font-headline">Todos os Usuários</CardTitle>
              <CardDescription>
                Uma lista de todos os administradores e super administradores.
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar usuários..." className="pl-8 sm:w-[300px]" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Função</TableHead>
                        <TableHead><span className="sr-only">Ações</span></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={user.avatar} data-ai-hint="profile picture" />
                                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">{user.name}</span>
                                </div>
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                                <Badge variant={user.role === 'Super Admin' ? 'default' : 'secondary'}>{user.role}</Badge>
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
                                        <DropdownMenuItem>Editar Permissões</DropdownMenuItem>
                                        <DropdownMenuItem>Redefinir Senha</DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive">Remover Usuário</DropdownMenuItem>
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
