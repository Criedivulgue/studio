'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <div className="relative container mx-auto p-8">
      <Button 
        variant="secondary"
        size="icon"
        className="absolute top-4 right-4 rounded-full"
        onClick={() => router.back()}
        aria-label="Voltar para a página anterior"
      >
        <X className="h-6 w-6" />
        <span className="sr-only">Voltar</span>
      </Button>
      <h1 className="text-4xl font-bold text-center mb-8">Política de Privacidade</h1>
      <div className="prose prose-lg mx-auto">
        <p>
          <strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <p>
          A sua privacidade e a proteção dos seus dados são prioridades fundamentais para a plataforma WhatsAi ("Plataforma"). Esta Política de Privacidade ("Política") foi elaborada para fornecer transparência sobre como tratamos os dados pessoais de nossos Administradores e dos Visitantes de seus respectivos chats, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) e outras regulamentações aplicáveis.
        </p>

        <h2 className="text-2xl font-bold mt-8">1. Definições Essenciais</h2>
        <ul>
          <li><strong>Plataforma:</strong> Refere-se ao software e aos serviços oferecidos sob a marca WhatsAi.</li>
          <li><strong>Super Administrador:</strong> A entidade que gerencia a Plataforma como um todo, oferecendo-a como serviço a terceiros.</li>
          <li><strong>Administrador ("Você"):</strong> O cliente que contrata a Plataforma para gerenciar seus próprios atendimentos. No contexto da LGPD, o Administrador é o <strong>Controlador</strong> dos dados de seus contatos e visitantes.</li>
          <li><strong>Visitante:</strong> O cliente final que interage com o chat de um Administrador. Seus dados são controlados pelo Administrador correspondente.</li>
          <li><strong>Dados Pessoais:</strong> Qualquer informação que identifique ou possa identificar uma pessoa natural.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8">2. Papel da WhatsAi e do Administrador</h2>
        <p>
          É crucial entender a distinção de papéis. O <strong>Administrador</strong>, ao utilizar nossa Plataforma, é o <strong>Controlador</strong> dos dados pessoais de seus Visitantes. Isso significa que é o Administrador quem toma as decisões sobre quais dados coletar e para quais finalidades. A <strong>WhatsAi</strong> atua como <strong>Operadora</strong>, processando esses dados exclusivamente sob as instruções e em nome do Administrador, conforme os limites técnicos e funcionais da Plataforma.
        </p>

        <h2 className="text-2xl font-bold mt-8">3. Coleta e Uso de Dados Pessoais</h2>
        
        <h3>3.1. Dados Coletados dos Administradores</h3>
        <ul>
          <li><strong>Informações de Cadastro:</strong> Nome, e-mail, senha (criptografada), e informações de pagamento para processamento da assinatura do serviço.</li>
          <li><strong>Configurações da Plataforma:</strong> Instruções de IA, configurações de perfil público (nome, avatar, cargo), e outras personalizações.</li>
          <li><strong>Dados de Uso:</strong> Logs de acesso, interações com a interface, e dados de telemetria para fins de segurança, suporte e melhoria do serviço.</li>
        </ul>

        <h3>3.2. Dados Coletados dos Visitantes (Processados pela WhatsAi em nome do Administrador)</h3>
        <ul>
          <li><strong>Dados de Identificação:</strong> Informações fornecidas ativamente pelo Visitante para se identificar junto ao Administrador (ex: nome, e-mail, telefone).</li>
          <li><strong>Conteúdo das Conversas:</strong> Todas as mensagens trocadas entre o Visitante, a IA, e o Administrador. <strong>Estes dados são estritamente confidenciais e sujeitos à garantia de segurança descrita na Seção 5.</strong></li>
          <li><strong>Metadados Técnicos:</strong> Endereço IP, tipo de navegador e identificadores anônimos (cookies) para garantir a continuidade da sessão e a segurança.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8">4. Finalidade do Tratamento dos Dados</h2>
        <p>Os dados são utilizados para:</p>
        <ul>
          <li><strong>Operar, manter e prover a Plataforma</strong> para o Administrador.</li>
          <li>Permitir que o Administrador <strong>gerencie seus contatos e atenda seus Visitantes</strong>.</li>
          <li><strong>Personalizar o atendimento via IA</strong>, quando autorizado pelo Administrador através do controle de privacidade disponível em seu painel.</li>
          <li><strong>Processar pagamentos</strong> e gerenciar a conta do Administrador.</li>
          <li><strong>Garantir a segurança</strong> da Plataforma e prevenir fraudes.</li>
          <li>Cumprir <strong>obrigações legais e regulatórias</strong>.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8">5. Segurança por Arquitetura: Nossa Garantia de Confidencialidade</h2>
        <p>
          A arquitetura de nosso banco de dados (Firebase Firestore) foi projetada com uma premissa de <strong>privacidade e isolamento por padrão (Privacy by Design)</strong>. Utilizamos regras de segurança que impõem uma separação lógica e intransponível entre os dados de diferentes Administradores.
        </p>
        <blockquote className="border-l-4 pl-4 italic my-4">
          <strong>Princípio Técnico Fundamental:</strong> O acesso a um registro de dado (como uma mensagem ou um contato) só é permitido se o requisitante autenticado (<code>request.auth.uid</code>) for o mesmo identificado como o proprietário daquele dado (<code>resource.data.adminId</code>). Não existem exceções a esta regra.
        </blockquote>
        <p>Na prática, isso significa que:</p>
        <ul>
          <li><strong>Isolamento Criptográfico:</strong> Os dados de um Administrador são inacessíveis a qualquer outro Administrador.</li>
          <li><strong>Ausência de "Chave Mestra":</strong> As regras de segurança não concedem privilégios de acesso ao Super Administrador ou à equipe de desenvolvimento da WhatsAi sobre o conteúdo das conversas dos Administradores. O acesso a estes dados para fins de manutenção ou suporte só é possível através de mecanismos explícitos e autorizados pelo Administrador, nunca por acesso direto ao banco de dados.</li>
        </ul>
        <p>Esta barreira arquitetônica é a nossa maior garantia de que os dados de seus clientes pertencem unicamente a você.</p>

        <h2 className="text-2xl font-bold mt-8">6. Compartilhamento de Dados</h2>
        <p>
          Nós não vendemos, alugamos ou comercializamos seus dados pessoais. O compartilhamento ocorre apenas com subprocessadores essenciais para a operação do serviço, sob contratos que garantem a proteção dos dados, tais como:
        </p>
        <ul>
          <li><strong>Provedores de Nuvem (Ex: Google Cloud):</strong> Para hospedagem da infraestrutura e banco de dados.</li>
          <li><strong>Provedores de IA (Ex: OpenAI):</strong> Para processamento das solicitações de linguagem natural, conforme as configurações de IA do Administrador.</li>
          <li><strong>Gateways de Pagamento:</strong> Para processar as assinaturas.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8">7. Seus Direitos como Titular de Dados</h2>
        <p>Conforme a LGPD, você (Administrador) e seus Visitantes possuem direitos sobre seus dados pessoais, incluindo:</p>
        <ul>
          <li>Confirmação da existência de tratamento;</li>
          <li>Acesso aos dados;</li>
          <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
          <li>Anonimização, bloqueio ou eliminação de dados desnecessários;</li>
          <li>Portabilidade dos dados;</li>
          <li>Eliminação dos dados pessoais tratados com consentimento;</li>
          <li>Informação sobre o compartilhamento de dados;</li>
          <li>Revogação do consentimento.</li>
        </ul>
        <p>O Administrador pode exercer a maioria desses direitos diretamente através de seu painel de controle. Para outras solicitações, entre em contato conosco.</p>

        <h2 className="text-2xl font-bold mt-8">8. Alterações a esta Política</h2>
        <p>
          Esta Política pode ser atualizada periodicamente. Notificaremos os Administradores sobre alterações significativas através de e-mail ou de avisos na Plataforma.
        </p>

        <h2 className="text-2xl font-bold mt-8">9. Contato</h2>
        <p>
          Para dúvidas, solicitações ou preocupações relacionadas a esta Política de Privacidade, entre em contato com nosso Encarregado de Proteção de Dados (DPO) através do e-mail: <strong>privacidade@whatsai.com</strong>.
        </p>
      </div>
    </div>
  );
}
