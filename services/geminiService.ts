// A URL do seu novo serviço de backend seguro
const tutorServiceUrl = 'https://tutor-service-v2-389818864410.us-central1.run.app/ask';

/**
 * Gera um documento completo e estruturado a partir da transcrição de uma aula.
 * @param transcript A transcrição bruta da aula.
 * @param token O token de autenticação do Firebase do usuário.
 * @returns O conteúdo do documento gerado pela IA.
 */
export async function generateLessonSummary(transcript: string, token: string): Promise<string> {
  const systemPrompt = `
Você é um especialista em educação e seu objetivo é transformar a transcrição de uma aula em um documento completo e informativo para os alunos. Analise a transcrição a seguir e gere um material de estudo claro, bem estruturado e que aprofunde os conceitos apresentados.

O documento deve incluir:
1.  **Título da Aula:** Crie um título conciso e descritivo que resuma o tema principal.
2.  **Introdução:** Um parágrafo que contextualiza o assunto e apresenta os objetivos de aprendizado da aula.
3.  **Principais Conceitos:** Identifique e explique os 3 a 5 conceitos mais importantes abordados na aula. Use listas (bullet points) para maior clareza.
4.  **Resumo Detalhado:** Elabore um resumo completo da aula, conectando as ideias de forma lógica e fluida.
5.  **Exemplos Práticos:** Se houver exemplos na transcrição, destaque-os. Se não houver, crie um ou dois exemplos simples para ilustrar os conceitos.
6.  **Conclusão:** Um parágrafo final que recapitule os pontos principais e reforce a importância do aprendizado.

Formate a saída em Markdown para facilitar a leitura.
`;

  try {
    const response = await fetch(tutorServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        question: systemPrompt, // Enviamos o prompt como a "pergunta"
        transcript: transcript,
      }),
    });

    if (!response.ok) {
      throw new Error(`A chamada ao backend falhou com status: ${response.status}`);
    }

    const data = await response.json();
    return data.text;

  } catch (error) {
    console.error("Erro ao gerar o resumo da aula:", error);
    return "Não foi possível gerar o resumo da aula. Exibindo transcrição original.";
  }
}

/**
 * Envia uma pergunta para o NOSSO backend seguro, que então chama o Gemini.
 * @param question A pergunta do usuário.
 * @param transcript O contexto da transcrição da aula.
 * @param token O token de autenticação do Firebase do usuário.
 * @returns O texto da resposta da IA.
 */
export async function askLessonTutor(question: string, transcript: string, token: string): Promise<string> {
  try {
    const response = await fetch(tutorServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        question,
        transcript,
      }),
    });

    if (!response.ok) {
      throw new Error(`A chamada ao backend falhou com status: ${response.status}`);
    }

    const data = await response.json();
    return data.text;

  } catch (error) {
    console.error("Erro ao chamar o tutor-service:", error);
    throw error; // Lançamos o erro para que o componente de chat possa tratá-lo.
  }
}
