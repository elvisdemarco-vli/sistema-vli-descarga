# 🔧 Solução de Problemas - Composições em Andamento

## Problema Reportado
Erro ao carregar composições em andamento

## Possíveis Causas e Soluções

### 1. 🔒 Problema de Permissões
**Sintoma:** Erro "permission-denied"
**Solução:** Verificar regras do Firestore

```javascript
// Regras necessárias para composicoes_em_andamento
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /composicoes_em_andamento/{document} {
      allow read, write: if true; // Para desenvolvimento
      // Para produção, use regras mais restritivas
    }
  }
}
```

### 2. 📊 Problema de Índices
**Sintoma:** Erro "failed-precondition"
**Solução:** Criar índices compostos no Firestore

No console do Firebase:
1. Vá para Firestore > Índices
2. Clique em "Criar índice"
3. Collection: `composicoes_em_andamento`
4. Campos: `status` (Ascending), `dataHoraSalvamento` (Descending)
5. Clique em "Criar"

### 3. 🌐 Problema de Conectividade
**Sintoma:** Erro "unavailable"
**Solução:** Verificar conexão com internet

### 4. 📋 Collection Não Existe
**Sintoma:** Collection vazia ou erro
**Solução:** Verificar se a collection foi criada

## Testes Implementados

### Botão "🔍 Teste Collection"
- Testa acesso básico à collection
- Verifica se há documentos
- Mostra detalhes do primeiro documento

### Botão "🔄 Composições em Andamento"
- Carrega composições com status "em_andamento"
- Filtra e ordena localmente para evitar problemas de índice
- Logs detalhados para debug
- **NOVO:** Mostra interface de seleção com lista de composições
- **NOVO:** Permite carregar composição específica na moega
- **NOVO:** Botão "🔄 Carregar" para cada composição
- **NOVO:** Botão "👁️ Ver" para ver detalhes da composição

### Botão "📥 Carregar Histórico"
- Carrega registros e composições salvas
- Usa queries simples para evitar problemas de índice
- Filtra e ordena localmente

### Melhorias Implementadas
- ✅ Queries simplificadas sem `orderBy` complexo
- ✅ Filtros aplicados localmente no JavaScript
- ✅ Ordenação feita no cliente
- ✅ Logs detalhados em todas as operações
- ✅ Tratamento específico para diferentes tipos de erro
- ✅ Verificação de índices e permissões

## Como Usar

1. **Primeiro:** Clique em "🔍 Teste Collection" para verificar acesso básico
2. **Se OK:** Clique em "🔄 Composições em Andamento" para carregar dados
3. **Se erro:** Verifique os logs no console do navegador

## Como Selecionar e Carregar Composições

1. **Clique em "🔄 Composições em Andamento"**
2. **Aguarde o carregamento** - aparecerá uma tabela com as composições
3. **Para carregar uma composição:**
   - Clique no botão "🔄 Carregar" da composição desejada
   - A composição será carregada na moega correspondente
   - A moega será automaticamente selecionada
4. **Para ver detalhes:**
   - Clique no botão "👁️ Ver" para ver informações da composição
5. **Para fechar a lista:**
   - Clique no botão "Fechar"

## Instruções para o Usuário

### Se o erro persistir:

1. **Abra o Console do Navegador:**
   - Pressione F12
   - Vá para a aba "Console"
   - Procure por mensagens de erro

2. **Teste a Conectividade:**
   - Clique em "🔗 Teste Firebase"
   - Verifique se aparece "Conectividade com Firebase OK!"

3. **Teste a Collection:**
   - Clique em "🔍 Teste Collection"
   - Verifique se consegue acessar a collection

4. **Carregue Dados:**
   - Clique em "📥 Carregar Histórico"
   - Verifique se carrega registros e composições

5. **Se ainda houver erro:**
   - Copie as mensagens de erro do console
   - Verifique as regras do Firestore
   - Crie os índices necessários

### Logs Esperados no Console:

```
=== TESTE ESPECÍFICO COMPOSIÇÕES EM ANDAMENTO ===
🔍 Testando acesso à collection composicoes_em_andamento...
✅ Collection reference criada
✅ Query simples criada
🚀 Executando query simples...
✅ Query executada com sucesso
📄 Documentos na collection: X
```

Se você não vir essas mensagens ou vir erros, o problema está na conectividade ou permissões.

## Logs de Debug

Os botões agora incluem logs detalhados:
- ✅ Configuração do Firebase
- ✅ Criação de collection reference
- ✅ Execução de queries
- ✅ Processamento de dados
- ❌ Detalhes completos de erros

## Estrutura Esperada dos Dados

```javascript
{
  id: "document_id",
  status: "em_andamento",
  dataHoraSalvamento: "2024-01-01T10:00:00Z",
  moega: "Moega 01",
  produto: "Produto",
  qtdVagoes: 10,
  // ... outros campos
}
```

## Próximos Passos

Se o problema persistir:
1. Verificar logs no console do navegador
2. Testar conectividade com "🔗 Teste Firebase"
3. Verificar regras do Firestore
4. Criar índices necessários
5. Verificar se há dados na collection 