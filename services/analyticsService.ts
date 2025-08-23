import { analytics } from './firebase';
import { logEvent as firebaseLogEvent } from 'firebase/analytics';

/**
 * Função genérica para registrar eventos no Google Analytics.
 * @param eventName Nome do evento a ser registrado.
 * @param eventParams Parâmetros adicionais para o evento.
 */
export const logEvent = (eventName: string, eventParams?: { [key: string]: any }) => {
  if (process.env.NODE_ENV === 'production') {
    firebaseLogEvent(analytics, eventName, eventParams);
  } else {
    console.log(`[Analytics DEV] Event: ${eventName}`, eventParams);
  }
};

/**
 * Registra um evento de visualização de página.
 * @param page_title O título da página.
 * @param page_path O caminho da página.
 */
export const logPageView = (page_title: string, page_path: string) => {
  logEvent('page_view', {
    page_title,
    page_path,
  });
};

// Adicione outras funções de evento específicas aqui conforme necessário
// Exemplo:
// export const logLogin = (method: string) => {
//   logEvent('login', { method });
// };
