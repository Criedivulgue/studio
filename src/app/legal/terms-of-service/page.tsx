'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export default function TermsOfServicePage() {
  const router = useRouter();

  return (
    <div className="relative container mx-auto p-8">
      <Button 
        variant="secondary"
        size="icon"
        className="absolute top-4 right-4 rounded-full"
        onClick={() => router.back()}
      >
        <X className="h-6 w-6" />
        <span className="sr-only">Voltar</span>
      </Button>
      <h1 className="text-4xl font-bold text-center mb-8">Termos de Serviço</h1>
      <div className="prose prose-lg mx-auto">
        <p>
          <strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}
        </p>

        <p>
          Bem-vindo ao nosso serviço de Atendimento Inteligente. Ao usar nossa plataforma, você concorda com estes Termos de Serviço. Leia-os com atenção.
        </p>

        <h2 className="text-2xl font-bold mt-8">1. Descrição do Serviço</h2>
        <p>
          Nossa plataforma oferece uma solução de atendimento ao cliente que utiliza Inteligência Artificial para fornecer respostas rápidas, personalizadas e disponíveis a qualquer hora. O serviço permite:
        </p>
        <ul>
          <li>
            <strong>Atendimento Personalizado:</strong> A IA aprende com uma base de informações e com as interações para oferecer um atendimento cada vez melhor.
          </li>
          <li>
            <strong>Disponibilidade Constante:</strong> Garante que seus clientes sempre recebam uma resposta, independentemente do horário ou local.
          </li>
          <li>
            <strong>Gerenciamento de Contatos:</strong> Permite organizar seus contatos por grupos e interesses, facilitando um atendimento segmentado e único.
          </li>
        </ul>

        <h2 className="text-2xl font-bold mt-8">2. Uso da Plataforma</h2>
        <p>
          Ao utilizar nossos serviços, você concorda em:
        </p>
        <ul>
          <li>
            Fornecer informações precisas e completas durante o cadastro e o uso da plataforma.
          </li>
          <li>
            Manter a confidencialidade de suas credenciais de acesso (seja como Administrador ou Super Admin).
          </li>
          <li>
            Utilizar a plataforma de forma legal e ética, respeitando a privacidade dos seus contatos e as leis de proteção de dados aplicáveis.
          </li>
          <li>
            Não utilizar o serviço para enviar spam, mensagens não solicitadas ou qualquer conteúdo ilegal ou ofensivo.
          </li>
        </ul>

        <h2 className="text-2xl font-bold mt-8">3. Responsabilidade sobre o Conteúdo</h2>
        <p>
          Você é o único responsável pelo conteúdo que insere na plataforma, incluindo as informações de seus contatos, as bases de conhecimento para a IA e as interações realizadas.
        </p>
        <p>
          Embora nossa IA seja projetada para ser precisa e prestativa, você reconhece que as respostas são geradas com base nas informações fornecidas. É sua responsabilidade revisar e garantir que o tom, a precisão e a qualidade do atendimento estejam alinhados com os valores da sua marca.
        </p>

        <h2 className="text-2xl font-bold mt-8">4. Gerenciamento de Contatos e Privacidade</h2>
        <p>
          A plataforma permite um gerenciamento detalhado dos seus contatos. Você concorda em obter o consentimento necessário de seus clientes para coletar, armazenar e processar suas informações em nossa plataforma. Você tem o controle total sobre os dados e pode decidir se a IA utilizará informações personalizadas para o atendimento, conforme descrito em nossa <strong>Política de Privacidade</strong>.
        </p>

        <h2 className="text-2xl font-bold mt-8">5. Limitação de Responsabilidade</h2>
        <p>
          O serviço é fornecido "como está". Embora nos esforcemos para garantir a máxima disponibilidade e confiabilidade, não podemos garantir que o serviço será ininterrupto ou livre de erros.
        </p>
        <p>
          Em nenhuma circunstância seremos responsáveis por quaisquer danos diretos, indiretos, incidentais ou consequenciais resultantes do uso ou da incapacidade de usar nossa plataforma.
        </p>

        <h2 className="text-2xl font-bold mt-8">6. Modificações no Serviço</h2>
        <p>
          Reservamo-nos o direito de modificar ou descontinuar, temporária ou permanentemente, o serviço (ou qualquer parte dele) com ou sem aviso prévio. Você concorda que não seremos responsáveis por qualquer modificação, suspensão ou descontinuação do serviço.
        </p>

        <h2 className="text-2xl font-bold mt-8">7. Disposições Gerais</h2>
        <p>
          Estes Termos constituem o acordo completo entre você e nós em relação ao uso do serviço e substituem quaisquer acordos anteriores. Se qualquer disposição destes Termos for considerada inválida, as demais disposições permanecerão em pleno vigor e efeito.
        </p>
      </div>
    </div>
  );
}
