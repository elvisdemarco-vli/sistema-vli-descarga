# Regras do Firestore - Controle Moega VLI

## Regras Recomendadas

Para que o sistema funcione corretamente, configure as seguintes regras no Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir leitura e escrita em todas as coleções para desenvolvimento
    // ⚠️ ATENÇÃO: Estas regras são para DESENVOLVIMENTO apenas!
    // Para produção, configure autenticação adequada
    
    match /{document=**} {
      allow read, write: if true;
    }
    
    // Regras específicas para as coleções do sistema:
    
    // Registros de operação
    match /registros/{document} {
      allow read, write: if true;
    }
    
    // Composições descarregadas
    match /composicoes_descarregadas/{document} {
      allow read, write: if true;
    }
    
    // Composições em andamento
    match /composicoes_em_andamento/{document} {
      allow read, write: if true;
    }
  }
}
```

## Como Configurar

1. Acesse o [Console do Firebase](https://console.firebase.google.com)
2. Selecione o projeto `controle-moega-vli`
3. Vá para **Firestore Database** > **Rules**
4. Substitua as regras existentes pelas regras acima
5. Clique em **Publish**

## Problemas Comuns

### Erro "permission-denied"
- Verifique se as regras estão publicadas
- Confirme que o projeto está correto
- Verifique se não há restrições de IP

### Erro "failed-precondition"
- Crie os índices compostos necessários:
  - `registros` collection: `data` (descending)
  - `composicoes_descarregadas` collection: `dataHoraSalvamento` (descending)
  - `composicoes_em_andamento` collection: `dataHoraSalvamento` (descending)

### Erro "unavailable"
- Verifique a conectividade com a internet
- Confirme se o Firebase está online
- Tente novamente em alguns minutos

## Segurança para Produção

Para ambiente de produção, configure autenticação adequada:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir acesso apenas para usuários autenticados
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
``` 