'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collectionGroup, getDocs, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { createDataTable } from '@/components/data-table';
import { columns, SuperAdminGroupColumn } from './_components/columns';

const SuperAdminGroupsDataTable = createDataTable<SuperAdminGroupColumn, any>();

export default function SuperAdminGroupsPage() {
  const { user, isSuperAdmin } = useAuth();
  const [groups, setGroups] = useState<SuperAdminGroupColumn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSuperAdmin) {
      setLoading(false);
      return;
    }

    const fetchAllGroups = async () => {
      setLoading(true);
      try {
        const tagsQuery = collectionGroup(db, 'tags');
        const querySnapshot = await getDocs(tagsQuery);
        
        const groupsData = await Promise.all(querySnapshot.docs.map(async (groupDoc) => {
          const groupData = groupDoc.data();
          if(groupData.type !== 'group') return null;

          const userDocRef = groupDoc.ref.parent.parent;
          let adminName = 'Desconhecido';
          let adminId = 'N/A';

          if (userDocRef) {
            adminId = userDocRef.id;
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              adminName = userDoc.data().name || 'Admin sem nome';
            }
          }
          
          return {
            id: groupDoc.id,
            name: groupData.name,
            memberCount: groupData.contactCount || 0, // CORREÇÃO: Renomeado de contactCount para memberCount
            adminName: adminName,
            adminId: adminId,
          } as SuperAdminGroupColumn;
        }));

        setGroups(groupsData.filter(Boolean) as SuperAdminGroupColumn[]);
      } catch (error) {
        console.error("Error fetching all groups: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllGroups();
  }, [isSuperAdmin]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Heading 
        title={`Todos os Grupos (${loading ? '...' : groups.length})`}
        description="Visualize todos os grupos de todos os administradores."
      />
      <Separator />
      
      <SuperAdminGroupsDataTable
        columns={columns}
        data={groups}
        searchKey="name"
        placeholder="Filtrar por nome do grupo..."
        emptyMessage="Nenhum grupo encontrado em toda a plataforma."
      />
    </div>
  );
}
