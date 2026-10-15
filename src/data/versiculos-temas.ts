export type TemaPilar =
  | 'palavra'
  | 'palavraDoDia'
  | 'comunhao'
  | 'adoracao'
  | 'servico'
  | 'geral';

export interface VersiculoTema {
  referencia: string;
  versiculo: string;
  reflexao: string;
}

const SLOT_MS = 12 * 60 * 60 * 1000;

export const VERSICULOS_TEMAS: Record<TemaPilar, VersiculoTema[]> = {
  palavra: [
    {
      referencia: 'Salmo 119:105',
      versiculo: 'Lâmpada para os meus pés é tua palavra e luz para o meu caminho.',
      reflexao: 'A Palavra de Deus não é apenas leitura: é direção. Quando buscamos as Escrituras com coração aberto, elas iluminam as decisões do nosso dia.',
    },
    {
      referencia: '2 Timóteo 3:16',
      versiculo: 'Toda a Escritura é inspirada por Deus e é útil para o ensino, para a repreensão, para a correção, para a educação na justiça.',
      reflexao: 'Toda página da Bíblia tem um propósito para a nossa formação. Ler é deixar Deus ensinar, corrigir e nos conduzir à vida reta.',
    },
    {
      referencia: 'Josué 1:8',
      versiculo: 'Não te apartes da boca do livro desta lei; medita nele dia e noite, para que tenhas cuidado de praticar segundo tudo o que nele está escrito.',
      reflexao: 'A promessa de sucesso espiritual acompanha a mediação constante. A Palavra precisa entrar na rotina para transformar o coração.',
    },
    {
      referencia: 'Isaías 40:8',
      versiculo: 'A erva seca, a flor cai, mas a palavra do nosso Deus subsiste para sempre.',
      reflexao: 'Modas e circunstâncias passam, mas a Palavra permanece. Ela é o fundamento seguro que sustenta a nossa fé.',
    },
    {
      referencia: '1 Pedro 1:25',
      versiculo: 'mas a palavra do Senhor subsiste para sempre. E este é o evangelho que vos foi anunciado.',
      reflexao: 'O evangelho é a palavra viva que nos regenerou. Guardá-la no coração é manter viva a nossa esperança.',
    },
    {
      referencia: 'Salmo 1:2-3',
      versiculo: 'Antes tem o seu prazer na lei do Senhor, e na sua lei medita de dia e de noite. Será como árvore plantada junto a ribeiros de águas, a qual dá o seu fruto na estação própria.',
      reflexao: 'Quem se deleita na Palavra se enraíza. A raiz profunda dá fruto mesmo nos períodos de seca.',
    },
  ],
  palavraDoDia: [
    {
      referencia: 'João 3:16',
      versiculo: 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.',
      reflexao: 'O maior gesto de amor da história foi feito por você. Hoje, receba de novo essa gratuidade e deixe-a mudar o seu dia.',
    },
    {
      referencia: 'Salmo 23:1',
      versiculo: 'O Senhor é o meu pastor; nada me faltará.',
      reflexao: 'Confiança nasce quando reconhecemos quem nos guia. Onde o Pastor vai, há provisão, descanso e direção.',
    },
    {
      referencia: 'Provérbios 3:5-6',
      versiculo: 'Confia no Senhor de todo o teu coração, e não te estribes no teu próprio entendimento. Reconhece-o em todos os teus caminhos, e ele endireitará as tuas veredas.',
      reflexao: 'Entregue a Deus aquilo que você não consegue resolver. Quando Ele orienta os passos, o caminho se abre.',
    },
    {
      referencia: 'Mateus 11:28',
      versiculo: 'Vinde a mim, todos os que estais cansados e sobrecarregados, e eu vos aliviarei.',
      reflexao: 'Jesus não pede que você carregue tudo sozinho. O convite de hoje é descansar Nele e trocar o peso pela paz.',
    },
    {
      referencia: 'Isaías 41:10',
      versiculo: 'Não temas, porque eu sou contigo; não olhes assustado, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento com a minha destra direita.',
      reflexao: 'O medo perde força quando lembramos quem está conosco. Deus não só está perto: Ele sustenta.',
    },
    {
      referencia: 'Filipenses 4:13',
      versiculo: 'Posso todas as coisas naquele que me fortalece.',
      reflexao: 'A força para hoje não vem da sua autonomia, mas de Cristo. Nele você tem recursos para cada desafio.',
    },
  ],
  comunhao: [
    {
      referencia: 'Atos 2:42',
      versiculo: 'Perseveravam na doutrina dos apóstolos, na comunhão, na quebra do pão e nas orações.',
      reflexao: 'A igreja primitiva crescia porque fazia questão de estar junta. Comunhão não é evento: é um estilo de vida compartilhado.',
    },
    {
      referencia: 'Salmo 133:1',
      versiculo: 'Ó quão bom e quão agradável é que os irmãos habitem juntos em união!',
      reflexao: 'Habitar junto em união é testemunho ao mundo. A harmonia entre os irmãos atrai a bênção de Deus.',
    },
    {
      referencia: 'João 13:34-35',
      versiculo: 'Um novo mandamento vos dou: que vos ameis uns aos outros, assim como eu vos amei. Nisto conhecerão todos que sois meus discípulos, se tiverdes amor uns pelos outros.',
      reflexao: 'O amor mútuo é a marca da igreja de Jesus. É nos pequenos gestos de cuidado que o mundo reconhece Cristo.',
    },
    {
      referencia: 'Hebreus 10:24-25',
      versiculo: 'Consideremo-nos uns aos outros, para nos estimularmos ao amor e às boas obras, não deixando de congregar-nos.',
      reflexao: 'A presença uns dos outros serve para nos fortalecer. Quando um cai, outro estende a mão — mas é preciso estarmos juntos.',
    },
    {
      referencia: '1 João 1:7',
      versiculo: 'Se andarmos na luz, como ele na luz está, temos uns com outros comunhão, e o sangue de Jesus seu Filho nos purifica de todo pecado.',
      reflexao: 'Comunhão verdadeira nasce na luz da confissão e do perdão. Com Jesus no centro, as relações se restauram.',
    },
    {
      referencia: 'Efésios 4:3',
      versiculo: 'Esforçando-vos por preservar a unidade do Espírito pelo vínculo da paz.',
      reflexao: 'A unidade não acontece sozinha: pede esforço e humildade. Paz é o laço que mantém a família de Deus de pé.',
    },
  ],
  adoracao: [
    {
      referencia: 'João 4:23-24',
      versiculo: 'Mas as horas vêm, e já são, em que os verdadeiros adoradores adorarão o Pai em espírito e em verdade; porque o Pai procura tais que o adorem. Deus é Espírito; e é necessário que os que o adorem o adorem em espírito e em verdade.',
      reflexao: 'Adoração é encontro do coração com Deus, não apenas som. Ele procura adoradores verdadeiros — seja o que for a nossa semana.',
    },
    {
      referencia: 'Salmo 95:6-7',
      versiculo: 'Ajoelhai-vos, venhamos e adoremos; ajoelhemo-nos diante do Senhor que nos fez. Porque ele é o nosso Deus, e nós o povo do seu pastoreio.',
      reflexao: 'Ajoelhar é reconhecer quem Ele é e quem somos. A adoração reordena o coração diante da grandeza de Deus.',
    },
    {
      referencia: 'Salmo 100:1-2',
      versiculo: 'Aclamai ao Senhor, ó toda a terra. Servi ao Senhor com alegria; apresentai-vos diante dele com júbilo.',
      reflexao: 'A alegria é uma forma de adoração. Servir com gozo declara que Deus é maior do que as nossas circunstâncias.',
    },
    {
      referencia: '1 Crônicas 16:29',
      versiculo: 'Dai ao Senhor a glória do seu nome; trazei uma oferta e apresentai-vos diante dele; adorai ao Senhor na santa formosura.',
      reflexao: 'Adorar é dar a Deus o lugar central e o melhor de nós. A oferta mais preciosa é o coração rendido.',
    },
    {
      referencia: 'Efésios 5:19-20',
      versiculo: 'Falando entre vós em salmos, hinos e cânticos espirituais, cantando e louvando o Senhor em os vossos corações, dando sempre graças por tudo ao Deus e Pai, em nome do nosso Senhor Jesus Cristo.',
      reflexao: 'O louvo vai do lábios ao coração, e a gratidão completa a canção. Toda circunstância pode virar hino.',
    },
    {
      referencia: 'Salmo 51:15',
      versiculo: 'Ó Senhor, abre os meus lábios, e a minha boca anunciará o teu louvor.',
      reflexao: 'A adoração começa quando pedimos a Deus que nos ensine a louvá-lo. Um coração quebrantado é o melhor louvor.',
    },
  ],
  servico: [
    {
      referencia: '1 Pedro 4:10',
      versiculo: 'Cada um conforme o dom que recebeu, ponha-o ao serviço uns dos outros, como bons despenseiros da multiforme graça de Deus.',
      reflexao: 'Servir é administrar a graça que recebemos. O dom que Deus deu a você existe para abençoar os outros.',
    },
    {
      referencia: 'Mateus 20:28',
      versiculo: 'assim como o Filho do Homem não veio para ser servido, mas para servir e dar a sua vida em resgate por muitos.',
      reflexao: 'Jesus redefiniu poder como serviço. Segui-lo é escolher a toalha e a bacia, não o trono.',
    },
    {
      referencia: 'Gálatas 5:13',
      versiculo: 'Porque, chamados a liberdade, irmãos, não a useis para ocasião à carne, mas servi-vos uns aos outros pelo amor.',
      reflexao: 'A liberdade em Cristo encontra propósito no amor ao próximo. Servir é o destino da nossa liberdade.',
    },
    {
      referencia: 'Colossenses 3:23-24',
      versiculo: 'Tudo quanto fizerdes, fazei-o de todo o coração, como para o Senhor, e não para os homens, sabendo que do Senhor recebereis a recompensa da herança.',
      reflexao: 'O serviço ganha eternidade quando é feito para Deus. Até a tarefa mais simples pode ser culto.',
    },
    {
      referencia: 'Isaías 6:8',
      versiculo: 'E ouvi a voz do Senhor que dizia: A quem enviarei? E quem irá por nós? E eu disse: Eis-me aqui, envia-me.',
      reflexao: 'A pergunta de Deus ainda ecoa hoje. A resposta de fé é simples: estou disponível, pode me usar.',
    },
    {
      referencia: '2 Coríntios 9:7',
      versiculo: 'Cada um segundo propôs no seu coração, não com tristeza nem por necessidade; porque Deus ama ao que dá com alegria.',
      reflexao: 'Servir com alegria agrada a Deus mais do que obrigação. O coração alegre é a medida do verdadeiro sacrifício.',
    },
  ],
  geral: [
    {
      referencia: 'Jeremias 29:11',
      versiculo: 'Porque eu bem sei os pensamentos que penso de vós, diz o Senhor; pensamentos de paz e não de mal, para vos dar o fim que esperais.',
      reflexao: 'Deus tem um plano bom para você, mesmo quando o caminho ainda não faz sentido. Confiança é esperar Nele.',
    },
    {
      referencia: 'Romanos 8:28',
      versiculo: 'E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus.',
      reflexao: 'Nada é desperdiçado nas mãos de Deus. Ele transforma até o difícil em instrumento de bem.',
    },
    {
      referencia: 'Salmos 46:1',
      versiculo: 'Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia.',
      reflexao: 'Quando o mundo treme, há um lugar firme: Deus. Ele não é um socorro distante, mas presente na hora exata.',
    },
    {
      referencia: 'Lamentações 3:22-23',
      versiculo: 'As misericórdias do Senhor são a causa de não sermos consumidos; as suas misericórdias renovam-se cada manhã. Grande é a tua fidelidade.',
      reflexao: 'Cada amanhecer traz misericórdia nova. Não importa ontem: hoje a fidelidade de Deus recomeça conosco.',
    },
    {
      referencia: 'Mateus 6:33',
      versiculo: 'Mas, buscai primeiro o reino de Deus e a sua justiça, e todas estas coisas vos serão acrescentadas.',
      reflexao: 'Prioridades em ordem mudam tudo. Quando Deus é o primeiro, o resto encontra o seu lugar.',
    },
    {
      referencia: 'Isaías 40:31',
      versiculo: 'Mas os que esperam no Senhor renovarão as suas forças, subirão com asas como águias; correrão, e não se cansarão; caminharão, e não se fatigarão.',
      reflexao: 'Esperar em Deus não é ficar parado: é ser renovado por Ele. A força que falta Ele mesmo entrega.',
    },
  ],
};

export function temaDoPilar(titulo: string): TemaPilar {
  const t = (titulo || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (t.includes('palavra do dia')) return 'palavraDoDia';
  if (t.includes('palavra')) return 'palavra';
  if (t.includes('comunh')) return 'comunhao';
  if (t.includes('adorac')) return 'adoracao';
  if (t.includes('servi')) return 'servico';
  return 'geral';
}

export function versiculoDoTema(tema: TemaPilar, agora: number = Date.now()): VersiculoTema {
  const pool = VERSICULOS_TEMAS[tema] ?? VERSICULOS_TEMAS.geral;
  const slot = Math.floor(agora / SLOT_MS);
  return pool[((slot % pool.length) + pool.length) % pool.length];
}
