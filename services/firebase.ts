// Importa as funções necessárias do SDK do Firebase
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// ADICIONADO: GoogleAuthProvider para o login com Google
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database"; // Adicionado para Realtime Database

// Objeto de configuração que lê as variáveis de ambiente seguras
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validação para garantir que as variáveis de ambiente foram carregadas
if (!firebaseConfig.apiKey) {
    throw new Error("Configuração do Firebase não encontrada. Verifique seu arquivo .env.local.");
}

// Inicializa o aplicativo Firebase
const app = initializeApp(firebaseConfig);

// Exporta os serviços do Firebase para serem usados em todo o aplicativo
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const rtdb = getDatabase(app); // Adicionado para Realtime Database
export const analytics = getAnalytics(app);

// ADICIONADO: Cria e exporta o provedor de autenticação do Google
export const googleProvider = new GoogleAuthProvider();

console.log("Firebase conectado com sucesso e provedor Google pronto!");
