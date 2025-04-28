// Leitor de QR Code
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth, Buttons, List, MessageMedia } = require('whatsapp-web.js');

// Configuração do cliente com LocalAuth (salva a sessão)
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Serviço de leitura do QR Code
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

// Quando estiver pronto
client.on('ready', () => {
    console.log('✅ Tudo certo! WhatsApp conectado.');
});

// Inicializa o cliente
client.initialize();

// Função de delay
const delay = ms => new Promise(res => setTimeout(res, ms));

// Controle de status dos clientes
const statusCliente = {}; // Exemplo: { '5511999999999@c.us': 'aguardando_comprovante' }

// Funil principal de mensagens
client.on('message', async msg => {
    const numero = msg.from;

    // Saudação inicial
    if (msg.body.match(/(dia|tarde|noite|oi|olá|ola)/i) && msg.from.endsWith('@c.us')) {
        const chat = await msg.getChat();
        await chat.sendStateTyping();
        const contact = await msg.getContact();
        const name = contact.pushname || "Cliente";

        await client.sendMessage(msg.from,
            `👋 Olá, ${name.split(" ")[0]}! Seja bem-vindo à *Drogaria Braga Mendes*!\n\n🕒 *Horário de funcionamento:*\n📅 Segunda a sábado: 8h às 20h\n📅 Domingo: 8h às 14h\n\n💬 Deixe sua mensagem! Nossa equipe retornará o mais breve possível.`
        );
    }

    // Enviar dados do Pix
    if (msg.body.match(/(pix)/i) && msg.from.endsWith('@c.us')) {
        await client.sendMessage(msg.from,
            '🔹 *Drogaria Braga Mendes*\n\n🔢 Chave Pix CPF:\n*020.621.342-58*\n👤 José Antônio Ferreira Ramos\n🏦 Banco: NU PAGAMENTOS - IP\n\n⚠️ *Confirmamos a entrega mediante o envio do comprovante de pagamento.* ⚠️'
        );
        statusCliente[numero] = 'aguardando_comprovante'; // Marca que está aguardando comprovante
    }

    // Cliente envia comprovante
    if (msg.hasMedia && statusCliente[numero] === 'aguardando_comprovante') {
        await client.sendMessage(msg.from,
            '✅ *Comprovante recebido!* Muito obrigado pela sua compra!\nSeu pedido está sendo separado para entrega. 🚚 Avisaremos assim que sair para entrega!'
        );
        delete statusCliente[numero]; // Limpa o status
    }

    // Cliente diz obrigado
    if (msg.body.match(/(obrigado|obrigada|obg|obgd)/i)) {
        const chat = await msg.getChat();

        if (statusCliente[numero] === 'aguardando_comprovante') {
            await client.sendMessage(msg.from,
                '📄 *Aguardamos o envio do comprovante* para confirmar sua compra. Qualquer dúvida estamos à disposição! ✨'
            );
        } else {
            await client.sendMessage(msg.from,
                '✨ *Drogaria Braga Mendes agradece a preferência!* ✨\n\nAgradecemos por confiar em nossos serviços. Sua satisfação é a nossa motivação! 💙\n\nSe puder, nos ajude deixando sua avaliação no Google:\n⭐ Avalie aqui: https://shre.ink/AvaliacaoDrogariaBragaMendes 🙏'
            );
        }
    }
});
