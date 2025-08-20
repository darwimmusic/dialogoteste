import { getFirestore, collection, doc, setDoc } from "firebase/firestore";
import { db } from "./services/firebase"; // Corrigido para importar 'db'
import { StandardAchievement } from "./types";

const achievements: Omit<StandardAchievement, "imageUrl">[] = [
  // Conquistas Gerais
  {
    id: "first_login",
    name: "Primeiro Login",
    description: "Você fez o seu primeiro login na plataforma.",
    xp: 10,
  },
  {
    id: "first_lesson_watched",
    name: "Primeira Aula Assistida",
    description: "Você assistiu à sua primeira aula.",
    xp: 10,
  },
  {
    id: "first_course_completed",
    name: "Primeiro Curso Completo",
    description: "Você completou o seu primeiro curso.",
    xp: 10,
  },
  {
    id: "first_live_lesson_watched",
    name: "Primeira Aula ao Vivo",
    description: "Você participou da sua primeira aula ao vivo.",
    xp: 10,
  },
  {
    id: "first_live_chat_message",
    name: "Mensagem no Chat ao Vivo",
    description: "Você enviou sua primeira mensagem no chat de uma aula ao vivo.",
    xp: 10,
  },
  {
    id: "first_transcript_download",
    name: "Download de Transcrição",
    description: "Você baixou a transcrição de uma aula pela primeira vez.",
    xp: 10,
  },
  {
    id: "first_course_search",
    name: "Pesquisa de Curso",
    description: "Você pesquisou por um curso pela primeira vez.",
    xp: 10,
  },
  {
    id: "first_ai_tutor_interaction",
    name: "Interação com Tutor IA",
    description: "Você interagiu com o tutor de IA pela primeira vez.",
    xp: 10,
  },

  // Conquistas do Fórum
  {
    id: "first_forum_post",
    name: "Primeiro Post no Fórum",
    description: "Você criou o seu primeiro post no fórum.",
    xp: 10,
  },
  {
    id: "first_forum_comment",
    name: "Primeiro Comentário no Fórum",
    description: "Você respondeu a um tópico no fórum pela primeira vez.",
    xp: 10,
  },
  {
    id: "first_comment_like",
    name: "Curtida em Comentário",
    description: "Você curtiu um comentário no fórum pela primeira vez.",
    xp: 10,
  },

  // Conquistas de Notícias
  {
    id: "first_news_read",
    name: "Primeira Notícia Lida",
    description: "Você leu a sua primeira notícia na plataforma.",
    xp: 10,
  },

  // Conquistas de Elo (Nível)
  { id: "elo_ferro", name: "Elo Ferro", description: "Você alcançou o elo Ferro.", xp: 10 },
  { id: "elo_bronze", name: "Elo Bronze", description: "Você alcançou o elo Bronze.", xp: 10 },
  { id: "elo_prata", name: "Elo Prata", description: "Você alcançou o elo Prata.", xp: 10 },
  { id: "elo_ouro", name: "Elo Ouro", description: "Você alcançou o elo Ouro.", xp: 10 },
  { id: "elo_platina", name: "Elo Platina", description: "Você alcançou o elo Platina.", xp: 10 },
  { id: "elo_esmeralda", name: "Elo Esmeralda", description: "Você alcançou o elo Esmeralda.", xp: 10 },
  { id: "elo_diamante", name: "Elo Diamante", description: "Você alcançou o elo Diamante.", xp: 10 },
  { id: "elo_mestre", name: "Elo Mestre", description: "Você alcançou o elo Mestre.", xp: 10 },
  { id: "elo_grao_mestre", name: "Elo Grão-Mestre", description: "Você alcançou o elo Grão-Mestre.", xp: 10 },
  { id: "elo_campeao", name: "Elo Campeão", description: "Você alcançou o elo Campeão.", xp: 10 },
];

const seedAchievements = async () => {
  const achievementsCollection = collection(db, "standard_achievements");
  console.log("Iniciando o povoamento de conquistas padrão...");

  for (const achievementData of achievements) {
    try {
      const achievementDoc: StandardAchievement = {
        ...achievementData,
        imageUrl: "", // Deixado em branco para ser preenchido manualmente
      };
      await setDoc(doc(achievementsCollection, achievementData.id), achievementDoc);
      console.log(`Conquista "${achievementData.name}" salva com sucesso.`);
    } catch (error) {
      console.error(`Erro ao salvar a conquista "${achievementData.name}":`, error);
    }
  }

  console.log("Povoamento de conquistas padrão concluído.");
};

// Para executar este script, você pode chamá-lo a partir de um arquivo de inicialização
// ou usar uma ferramenta como o ts-node: `ts-node seedStandardAchievements.ts`
seedAchievements();
