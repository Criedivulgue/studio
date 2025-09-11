import { Heading } from "@/components/ui/heading";
import { ProfileForm } from "./_components/profile-form";

export default function SuperAdminProfilePage() {
  return (
    <div className="space-y-6 p-4 md:p-8">
      <Heading
        title="Perfil de Super Administrador"
        description="Gerencie suas informações de perfil e configurações de conta."
      />
      <ProfileForm />
    </div>
  );
}
