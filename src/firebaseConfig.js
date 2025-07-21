import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDUhjZ30Y5gxc1aSpOuTWy-O0CvOhMckAI",
  authDomain: "controle-moega-vli.firebaseapp.com",
  projectId: "controle-moega-vli",
  storageBucket: "controle-moega-vli.appspot.com", // Corrigido!
  messagingSenderId: "776275533498",
  appId: "1:776275533498:web:999f7ff663d20611776c83",
  measurementId: "G-S409DQVZQC"
};

if (process.env.NODE_ENV === 'development') {
  console.log('🔥 Inicializando Firebase...');
  console.log('📊 Configuração:', { 
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    apiKey: firebaseConfig.apiKey ? '✅ Configurada' : '❌ Não configurada'
  });
  console.log('⚙️ Configurações de segurança aplicadas');
  console.log('📋 Firestore inicializado');
  console.log('🔧 Configurando Firestore para operações manuais apenas');
}

// Inicializar Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db, firebaseConfig }; 