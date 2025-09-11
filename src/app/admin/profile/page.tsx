import { Heading } from "@/components/ui/heading";
import { ProfileForm } from "./_components/profile-form";
import { AccountSettingsForm } from "./_components/account-settings-form";
import { ChatLinkDisplay } from "./_components/chat-link-display"; // 1. Importar o novo componente

export default function ProfilePage() {
  return (
    <div className="space-y-6 p-4 md:p-8">
      <Heading
        title="Perfil e Conta"
        description="Gerencie as informações do seu perfil público e suas configurações de conta."
      />

      {/* 2. Adicionar o componente de link do chat aqui */}
      <ChatLinkDisplay />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProfileForm />
        <AccountSettingsForm />
      </div>

    </div>
  );
}
