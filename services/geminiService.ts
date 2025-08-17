// A URL do seu novo serviço de backend seguro
const tutorServiceUrl = 'COLE_A_URL_DO_SEU_TUTOR_SERVICE_AQUI/ask';

/**
 * Envia uma pergunta para o NOSSO backend seguro, que então chama o Gemini.
 * @param question A pergunta do usuário.
 * @param transcript O contexto da transcrição da aula.
 * @returns O texto da resposta da IA.
 */
export async function askLessonTutor(question: string, transcript: string): Promise<string> {
  try {
    const response = await fetch(tutorServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
    return "Desculpe, ocorreu um erro ao tentar me comunicar com a IA. Por favor, tente novamente mais tarde.";
  }
}