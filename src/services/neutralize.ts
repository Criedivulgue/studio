import { saveAiConfig } from './configService';

async function neutralizeGhostDocument() {
    try {
        console.log('Neutralizando documento fantasma: ai-configs/superadmin');
        await saveAiConfig('superadmin', { customInstructions: '', useCustomInformation: false });
        console.log('Documento fantasma neutralizado com sucesso.');
    } catch (error) {
        console.error('Falha ao neutralizar o documento fantasma:', error);
    }
}

neutralizeGhostDocument();
