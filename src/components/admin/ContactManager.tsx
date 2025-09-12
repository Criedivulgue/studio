'use client';

import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Plus, ArrowUpFromLine, ArrowDownToLine } from 'lucide-react';
import { createDataTable } from '@/components/data-table';
import { columns, ContactColumn } from '@/app/admin/contacts/_components/columns';
import { AddContactModal } from '@/components/admin/AddContactModal';
import { ImportContactsModal } from '@/components/admin/ImportContactsModal';

// A interface de props foi atualizada para receber dados e handlers do componente pai.
type ContactManagerProps = {
  user: any; // O objeto do usuário autenticado
  contacts: ContactColumn[];
  loading: boolean;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (isOpen: boolean) => void;
  isImportModalOpen: boolean;
  setIsImportModalOpen: (isOpen: boolean) => void;
  handleExport: () => void;
  handleModalSuccess: () => void;
};

const ContactsDataTable = createDataTable<ContactColumn, any>();

// O componente agora é apenas para apresentação e não busca mais seus próprios dados.
export function ContactManager({
  user,
  contacts,
  loading,
  isAddModalOpen,
  setIsAddModalOpen,
  isImportModalOpen,
  setIsImportModalOpen,
  handleExport,
  handleModalSuccess
}: ContactManagerProps) {

  return (
    <>
      {/* A lógica do modal permanece, mas seu estado é controlado pelo pai */}
      <AddContactModal 
        adminUid={user.id}
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={handleModalSuccess}
        isSuperAdmin={user.role === 'superadmin'}
      />
      <ImportContactsModal 
        adminUid={user.id}
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={handleModalSuccess}
      />

      <div className="flex-1 space-y-4 pt-6">
        <div className="flex items-center justify-between">
          <Heading 
            title={`Meus Contatos (${loading ? '...' : contacts.length})`}
            description="Gerencie seus contatos para facilitar o envio de mensagens."
          />
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
                <ArrowUpFromLine className="mr-2 h-4 w-4" /> Importar
            </Button>
            <Button variant="outline" onClick={handleExport}>
                <ArrowDownToLine className="mr-2 h-4 w-4" /> Exportar
            </Button>
            <Button onClick={() => setIsAddModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Adicionar Contato
            </Button>
          </div>
        </div>
        <Separator />
        
        {/* A tabela de dados agora recebe os dados diretamente via props */}
        <ContactsDataTable
          columns={columns}
          data={contacts}
          searchKey="name"
          placeholder="Filtrar por nome..."
          emptyMessage="Nenhum contato encontrado. Adicione um para começar!"
        />
      </div>
    </>
  );
}
