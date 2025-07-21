# 🔧 Guia de Troubleshooting - Firestore

## 🚨 Problemas Comuns e Soluções

### 1. "Carregar Dados" não funciona

**Sintomas:**
- Botão não responde
- Nenhuma mensagem de feedback
- Console mostra erros de permissão

**Soluções:**

#### A. Verificar Regras do Firestore
1. Acesse: https://console.firebase.google.com/project/controle-moega-vli/firestore/rules
2. Configure as regras conforme `FIREBASE_RULES.md`
3. Clique em "Publish"

#### B. Testar Conexão
Use o botão "🔧 Testar Conexão" para verificar se o Firebase está acessível.

#### C. Verificar Console do Navegador
1. Abra F12 (DevTools)
2. Vá para a aba "Console"
3. Procure por erros relacionados ao Firebase

### 2. Erro "permission-denied"

**Causa:** Regras de segurança bloqueando acesso

**Solução:**
```javascript
// Regras temporárias para desenvolvimento
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 3. Erro "failed-precondition"

**Causa:** Índices compostos não criados

**Solução:**
1. Acesse o console do Firebase
2. Vá para Firestore > Índices
3. Crie os índices necessários:
   - Collection: `registros`, Field: `data` (descending)
   - Collection: `composicoes_descarregadas`, Field: `dataHoraSalvamento` (descending)
   - Collection: `composicoes_em_andamento`, Field: `dataHoraSalvamento` (descending)

### 4. Erro "unavailable"

**Causa:** Problemas de conectividade ou serviço indisponível

**Soluções:**
- Verificar conexão com a internet
- Aguardar alguns minutos e tentar novamente
- Verificar status do Firebase: https://status.firebase.google.com

### 5. Erro 400 - Listen/Channel

**Causa:** Listeners automáticos sendo criados

**Solução:**
- O código já foi corrigido para não criar listeners automáticos
- Recarregue a página completamente (Ctrl+F5)

## 🔍 Diagnóstico Passo a Passo

### Passo 1: Verificar Configuração
```javascript
// No console do navegador, execute:
console.log('Firebase Config:', {
  projectId: 'controle-moega-vli',
  authDomain: 'controle-moega-vli.firebaseapp.com'
});
```

### Passo 2: Testar Conexão Simples
```javascript
// Teste básico de conectividade
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from './firebaseConfig';

const testConnection = async () => {
  try {
    const testCollection = collection(db, 'test');
    const testQuery = query(testCollection, limit(1));
    await getDocs(testQuery);
    console.log('✅ Conexão OK');
  } catch (error) {
    console.error('❌ Erro de conexão:', error);
  }
};
```

### Passo 3: Verificar Regras
1. Acesse o console do Firebase
2. Vá para Firestore > Rules
3. Verifique se as regras estão publicadas
4. Use o simulador de regras para testar

## 🛠️ Ferramentas de Diagnóstico

### Botões Disponíveis no Sistema:
- **🔧 Testar Conexão**: Verifica conectividade básica
- **📥 Carregar Histórico**: Carrega dados com feedback detalhado
- **🔄 Composições em Andamento**: Testa carregamento específico

### Logs de Desenvolvimento:
Quando `NODE_ENV === 'development'`, o sistema mostra logs detalhados:
```
🔍 Iniciando carregamento de registros...
📊 Filtro de data: 2024-01-15
🚀 Executando query de registros...
✅ Registros carregados: 5 documentos
✅ Estado de registros atualizado
```

## 📋 Checklist de Verificação

- [ ] Regras do Firestore configuradas
- [ ] Índices compostos criados
- [ ] Conexão com internet funcionando
- [ ] Console do Firebase acessível
- [ ] Projeto correto selecionado
- [ ] Configuração do Firebase correta
- [ ] Sem erros no console do navegador

## 🆘 Suporte

Se os problemas persistirem:

1. **Verifique os logs** no console do navegador
2. **Teste a conexão** usando o botão de teste
3. **Configure as regras** conforme `FIREBASE_RULES.md`
4. **Recarregue a página** completamente
5. **Monitore o console** para novos erros

## 🔗 Links Úteis

- [Console do Firebase](https://console.firebase.google.com/project/controle-moega-vli)
- [Documentação do Firestore](https://firebase.google.com/docs/firestore)
- [Regras de Segurança](https://firebase.google.com/docs/firestore/security/get-started)
- [Status do Firebase](https://status.firebase.google.com) 