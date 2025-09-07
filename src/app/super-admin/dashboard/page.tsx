import { redirect } from 'next/navigation';

export default function SuperAdminDashboardRedirect() {
  // Redireciona a página principal do super-admin para o painel de contatos por padrão
  redirect('/super-admin/contacts');
}
