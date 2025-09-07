"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
                <Logo />
            </div>
          <CardTitle className="text-2xl font-headline">Login</CardTitle>
          <CardDescription>
            Entre com seu email para acessar seu painel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nome@exemplo.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Senha</Label>
              </div>
              <Input id="password" type="password" required />
            </div>
            <Button type="submit" className="w-full">
              Login
            </Button>
            <p className="mt-4 text-center text-sm">
                Ainda não tem uma conta?{" "}
                <Link href="#" className="underline">
                    Cadastre-se
                </Link>
            </p>
          </div>
          <div className="mt-4 text-center text-xs">
            <p className="font-semibold">Acesso Rápido (Demo):</p>
            <div className="flex justify-center gap-2 mt-2">
                <Button variant="link" asChild><Link href="/admin/dashboard">Painel Admin</Link></Button>
                <Button variant="link" asChild><Link href="/super-admin/dashboard">Painel Super Admin</Link></Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
