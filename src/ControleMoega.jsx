import React, { useState, useEffect, useRef } from "react";
import { TextField as MuiTextField, Button as MuiButton, Grid, Paper, Typography, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Snackbar, Alert, Stack, Checkbox, Tooltip as MuiTooltip, Container } from '@mui/material';
import { app, db, firebaseConfig } from "./firebaseConfig";
import { collection, addDoc, getDocs, query, where, orderBy, limit, doc, getDoc, startAfter, setDoc, deleteDoc } from "firebase/firestore";
import * as XLSX from "xlsx";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend
} from "recharts";
import Cronometro from './components/Cronometro';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { debounce } from 'lodash';

// Função utilitária para converter ms em minutos:segundos
function msParaMinutosSegundos(ms) {
  const min = Math.floor(ms / 60000);
  const sec = ((ms % 60000) / 1000).toFixed(0);
  return `${min}:${sec < 10 ? "0" : ""}${sec}`;
}

// Removido getAuth automático para evitar listeners
// const auth = getAuth(app);

function Feedback({ type, message, onClose }) {
  return (
    <Snackbar open={!!message} autoHideDuration={4000} onClose={onClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      // Acessibilidade: área de alerta dinâmica para leitores de tela
      aria-live="polite"
    >
      <Alert onClose={onClose} severity={type === 'success' ? 'success' : 'error'} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
}

function RegistroForm({ registro, setRegistro, onSalvar, loading, errors }) {
  return (
    <Paper elevation={3} sx={{ p: 3, mb: 2 }}>
      <Typography variant="h6" gutterBottom>Formulário de novo registro</Typography>
      <form
        onSubmit={e => { e.preventDefault(); onSalvar(); }}
        aria-label="Formulário de novo registro"
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <MuiTextField
              fullWidth
              id="prefixo"
              label="Prefixo *"
              value={registro.prefixo}
              onChange={e => setRegistro({ ...registro, prefixo: e.target.value })}
              error={!!errors.prefixo}
              helperText={errors.prefixo}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <MuiTextField
              fullWidth
              id="qtdVagoes"
              label="Qtd Vagões *"
              type="number"
              value={registro.qtdVagoes}
              onChange={e => setRegistro({ ...registro, qtdVagoes: Number(e.target.value) })}
              error={!!errors.qtdVagoes}
              helperText={errors.qtdVagoes}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <MuiTextField
              fullWidth
              id="maquinista"
              label="Maquinista"
              value={registro.maquinista}
              onChange={e => setRegistro({ ...registro, maquinista: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <MuiTextField
              fullWidth
              id="armazem"
              label="Armazém"
              value={registro.armazem}
              onChange={e => setRegistro({ ...registro, armazem: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <MuiButton
              fullWidth
              variant="contained"
              color="primary"
              type="submit"
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Salvar Registro"}
            </MuiButton>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
}

function RegistrosTable({ registros }) {
  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Data</TableCell>
            <TableCell>Prefixo</TableCell>
            <TableCell>Qtd</TableCell>
            <TableCell>TP Puxada</TableCell>
            <TableCell>TP Descarga</TableCell>
            <TableCell>Impacto</TableCell>
            <TableCell>Maquinista</TableCell>
            <TableCell>Armazém</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {registros.map((r) => (
            <TableRow key={r.id} hover>
              <TableCell>{r.data}</TableCell>
              <TableCell>{r.prefixo}</TableCell>
              <TableCell>{r.qtdVagoes}</TableCell>
              <TableCell>{r.tempoPuxada}</TableCell>
              <TableCell>{r.tempoDescarga}</TableCell>
              <TableCell>{r.tempoImpacto}</TableCell>
              <TableCell>{r.maquinista}</TableCell>
              <TableCell>{r.armazem}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function DesempenhoGrafico({ dados }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={dados} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="data" />
        <YAxis label={{ value: "Minutos", angle: -90, position: "insideLeft" }} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="puxada" stroke="#8884d8" name="Puxada" />
        <Line type="monotone" dataKey="descarga" stroke="#82ca9d" name="Descarga" />
        <Line type="monotone" dataKey="impacto" stroke="#ff7300" name="Impacto" />
      </LineChart>
    </ResponsiveContainer>
  );
}

function HistoricoComposicoes({ composicoes, onFechar }) {
  return (
    <Paper sx={{ mt: 2, p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" color="primary">
          📋 Histórico de Composições Descarregadas
        </Typography>
        <MuiButton onClick={onFechar} variant="outlined" size="small">
          Fechar
        </MuiButton>
      </Stack>

      {composicoes.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          Nenhuma composição encontrada para esta data.
        </Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Data</strong></TableCell>
                <TableCell><strong>Moega</strong></TableCell>
                <TableCell><strong>Produto</strong></TableCell>
                <TableCell><strong>Vagões</strong></TableCell>
                <TableCell><strong>Início</strong></TableCell>
                <TableCell><strong>Fim</strong></TableCell>
                <TableCell><strong>Tempo Total</strong></TableCell>
                <TableCell><strong>TMD</strong></TableCell>
                <TableCell><strong>Impactos</strong></TableCell>
                <TableCell><strong>Ações</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {composicoes.map((comp) => (
                <TableRow key={comp.id} hover>
                  <TableCell>{comp.data}</TableCell>
                  <TableCell>{comp.moega}</TableCell>
                  <TableCell>{comp.produto}</TableCell>
                  <TableCell>{comp.qtdVagoes}</TableCell>
                  <TableCell>{comp.horarioInicio}</TableCell>
                  <TableCell>{comp.horarioFim}</TableCell>
                  <TableCell>{comp.tempoTotal}</TableCell>
                  <TableCell>{comp.tmd}</TableCell>
                  <TableCell>
                    {comp.impactosPuxada + comp.impactosDescarga > 0 ? (
                      <Typography variant="caption" color="error">
                        P: {comp.impactosPuxada} | D: {comp.impactosDescarga}
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="success">
                        ✓ Sem impactos
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <MuiButton
                      size="small"
                      variant="outlined"
                      onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(formatarMensagemWhatsApp(comp))}`, '_blank')}
                      aria-label="Compartilhar via WhatsApp"
                    >
                      📱
                    </MuiButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}

function formatarMensagemWhatsApp(comp) {
  return [
    `*📋 COMPOSIÇÃO DESCARREGADA - ${comp.moega}*`,
    ``,
    `*📊 DADOS OPERACIONAIS*`,
    `Data: ${comp.data}`,
    `Produto: ${comp.produto}`,
    `Armazém: ${comp.armazem}`,
    `Maquinista: ${comp.maquinista}`,
    `Qtd Vagões: ${comp.qtdVagoes}`,
    ``,
    `*⏰ CRONOGRAMA*`,
    `Início: ${comp.horarioInicio}`,
    `Fim: ${comp.horarioFim}`,
    `Tempo Total: ${comp.tempoTotal}`,
    `Tempo Total Puxada: ${comp.tempoTotalPuxada}`,
    `TMD: ${comp.tmd}`,
    ``,
    `*⚠️ IMPACTOS*`,
    `Puxada: ${comp.impactosPuxada}`,
    `Descarga: ${comp.impactosDescarga}`,
    ``,
    `*📋 POSICIONAMENTOS*`,
    ...comp.posicionamentos.map(p =>
      `Pos ${p.posicao}: ${p.vagões} vagões | Puxada: ${p.tempoPuxada} | Descarga: ${p.tempoDescarga}`
    )
  ].join('\n');
}

function ComposicoesEmAndamento({ composicoes, onCarregar, onFechar }) {
  const formatarDataHora = (dataHora) => {
    if (!dataHora) return 'N/A';
    try {
      const data = new Date(dataHora);
      return data.toLocaleString('pt-BR');
    } catch (error) {
      return 'Data inválida';
    }
  };

  // Função auxiliar para determinar status
  function getStatus(comp) {
    const cronos = Array.isArray(comp.cronos) ? comp.cronos : [];
    // Log para depuração
    if (process.env.NODE_ENV === 'development') {
      console.log('Status composição:', comp.id, cronos.map((c, i) => ({
        idx: i,
        puxadaAtivo: c?.puxadaAtivo,
        descargaAtivo: c?.descargaAtivo,
        puxadaTempo: c?.puxadaTempo,
        descargaTempo: c?.descargaTempo
      })));
    }
    const todosFinalizados = cronos.length > 0 && cronos.every(c => c && !c.puxadaAtivo && !c.descargaAtivo && Number(c.puxadaTempo) > 0 && Number(c.descargaTempo) > 0);
    const cronosAtivos = cronos.filter(c => c && (c.puxadaAtivo || c.descargaAtivo)).length;
    const posIncompletos = cronos.filter(c => c && (Number(c.puxadaTempo) === 0 || Number(c.descargaTempo) === 0)).length;
    if (todosFinalizados) {
      return <span style={{ color: '#27ae60', fontWeight: 'bold' }}>✅ CONCLUÍDA</span>;
    } else if (cronosAtivos > 0) {
      return <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>⏱️ ATIVO ({cronosAtivos})</span>;
    } else if (posIncompletos > 0) {
      return <span style={{ color: '#f39c12', fontWeight: 'bold' }}>🔄 INCOMPLETO ({posIncompletos})</span>;
    } else if (!comp.confirmado) {
      return <span style={{ color: '#3498db', fontWeight: 'bold' }}>📝 PENDENTE</span>;
    } else {
      return <span style={{ color: '#27ae60', fontWeight: 'bold' }}>✅ CONCLUÍDA</span>;
    }
  }

  return (
    <Paper sx={{
      mt: 2,
      p: 3,
      border: '2px solid #1976d2',
      backgroundColor: '#f8f9fa',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
    }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
          🔄 Composições em Andamento ({composicoes.length})
        </Typography>
        <Stack direction="row" spacing={1}>
          <MuiButton onClick={onFechar} variant="contained" color="secondary" size="small">
            ❌ Fechar
          </MuiButton>
        </Stack>
      </Stack>

      {composicoes.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7' }}>
          <Typography variant="h6" color="warning.main" sx={{ mb: 2 }}>
            📭 Nenhuma Composição em Andamento
          </Typography>
          <Typography color="text.secondary">
            Não foram encontradas composições em andamento para continuar.
          </Typography>
        </Paper>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Moega</strong></TableCell>
                <TableCell><strong>Produto</strong></TableCell>
                <TableCell><strong>Vagões</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Início</strong></TableCell>
                <TableCell><strong>Salvamento</strong></TableCell>
                <TableCell><strong>Maquinista</strong></TableCell>
                <TableCell><strong>Operador</strong></TableCell>
                <TableCell><strong>Ações</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {composicoes.map((comp) => (
                <TableRow key={comp.id} hover>
                  <TableCell>{comp.moega || 'N/A'}</TableCell>
                  <TableCell>{comp.produto || 'N/A'}</TableCell>
                  <TableCell>{comp.qtdVagoes || 0}</TableCell>
                  <TableCell>{getStatus(comp)}</TableCell>
                  <TableCell>{comp.inicio || 'N/A'}</TableCell>
                  <TableCell>{formatarDataHora(comp.dataHoraSalvamento)}</TableCell>
                  <TableCell>{comp.maquinista || 'N/A'}</TableCell>
                  <TableCell>{comp.operador || 'N/A'}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <MuiButton
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={() => {
                          if (process.env.NODE_ENV === 'development') {
                            console.log('🔄 Carregando composição:', comp);
                          }
                          onCarregar(comp);
                        }}
                        sx={{ minWidth: 100 }}
                      >
                        🔄 Carregar
                      </MuiButton>
                      <MuiButton
                        variant="outlined"
                        color="info"
                        size="small"
                        onClick={() => {
                          if (process.env.NODE_ENV === 'development') {
                            console.log('📊 Detalhes da composição:', comp);
                          }
                          alert(`📋 Detalhes da Composição:\n\n` +
                            `🏭 Moega: ${comp.moega || 'N/A'}\n` +
                            `📦 Produto: ${comp.produto || 'N/A'}\n` +
                            `🚂 Vagões: ${comp.qtdVagoes || 0}\n` +
                            `⏰ Início: ${comp.inicio || 'N/A'}\n` +
                            `👨‍💼 Maquinista: ${comp.maquinista || 'N/A'}\n` +
                            `👨‍🔧 Operador: ${comp.operador || 'N/A'}\n` +
                            `💾 Salvamento: ${formatarDataHora(comp.dataHoraSalvamento)}\n\n` +
                            `📊 Dados completos disponíveis no console.`);
                        }}
                      >
                        👁️ Ver Detalhes
                      </MuiButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}

const PRODUTOS = ["Açúcar", "Soja", "Milho", "Farelo"];
const VAGOES_POR_POSICIONAMENTO = 4;

function calcularPosicionamentos(qtdVagoes) {
  return Math.ceil(qtdVagoes / VAGOES_POR_POSICIONAMENTO);
}

// Adiciona ao modelo de crono o array de trocas de turno
function criarNovoCrono() {
  return {
    puxadaTempo: 0,
    descargaTempo: 0,
    puxadaAtivo: false,
    descargaAtivo: false,
    puxadaExcedeu: false,
    descargaExcedeu: false,
    tempoImpactoPuxada: 0,
    tempoImpactoDescarga: 0,
    motivoImpactoPuxada: '',
    motivoImpactoDescarga: '',
    motivoImpactoDescargaAdicional: '',
    trocasDeTurno: [] // NOVO: array de eventos de troca de turno
  };
}

function MoegaCard({ moega, dados, setDados, setFeedback }) {
  // Garantir que cronos está definido antes de qualquer uso
  const cronos = Array.isArray(dados.cronos) ? dados.cronos : [];
  if (process.env.NODE_ENV === 'development') {
    console.log('=== MOEGACARD RENDERIZANDO ===', { moega, dados });
    console.log('=== CRONOS NO MOEGACARD ===', {
      dadosCronos: dados.cronos,
      cronosFinal: cronos,
      isArray: Array.isArray(cronos)
    });
  }
  const { produto, qtdVagoes, posicionamentos, armazem, inicio, maquinista, operador } = dados;
  const numPos = calcularPosicionamentos(qtdVagoes || 0);

  // Usar os dados específicos da moega atual
  const setCronos = (novosCronos) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('=== SETCRONOS CHAMADO ===', { novosCronos, tipo: typeof novosCronos });
    }
    if (typeof novosCronos === 'function') {
      const resultado = novosCronos(cronos);
      if (process.env.NODE_ENV === 'development') {
        console.log('Resultado da função setCronos:', resultado);
      }
      setDados(d => ({ ...d, cronos: resultado }));
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('Valor direto setCronos:', novosCronos);
      }
      setDados(d => ({ ...d, cronos: novosCronos }));
    }
  };
  const confirmado = dados.confirmado || false;
  const setConfirmado = (valor) => setDados(d => ({ ...d, confirmado: valor }));
  const mostrarResumo = dados.mostrarResumo || false;
  const setMostrarResumo = (valor) => setDados(d => ({ ...d, mostrarResumo: valor }));
  const selecionados = Array.isArray(dados.selecionados) ? dados.selecionados : [];
  if (process.env.NODE_ENV === 'development') {
    console.log('=== SELECIONADOS NO MOEGACARD ===', {
      dadosSelecionados: dados.selecionados,
      selecionadosFinal: selecionados,
      isArray: Array.isArray(selecionados)
    });
  }
  const setSelecionados = (valor) => setDados(d => ({ ...d, selecionados: valor }));
  const vagoesPorPos = dados.vagoesPorPos || [];
  const setVagoesPorPos = (valor) => setDados(d => ({ ...d, vagoesPorPos: valor }));
  const salvando = dados.salvando || false;
  const setSalvando = (valor) => setDados(d => ({ ...d, salvando: valor }));

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('=== INICIALIZANDO CRONÔMETROS ===');
      console.log('Dados atuais:', { numPos, qtdVagoes, cronosLength: Array.isArray(cronos) ? cronos.length : 'não é array', cronos });
    }
    // Só inicializa se cronos estiver vazio ou undefined
    if (numPos <= 0) {
      setCronos([]);
      setVagoesPorPos([]);
      return;
    }
    if (!Array.isArray(cronos) || cronos.length !== numPos) {
      // Sempre inicializa todos os cronômetros do zero ao confirmar dados ou mudar qtdVagoes
      const novosCronos = Array.from({ length: numPos }, () => criarNovoCrono());
      setCronos(novosCronos);
      // Inicializa o array de vagões por posicionamento
      const total = qtdVagoes || 0;
      const cheios = Math.floor(total / VAGOES_POR_POSICIONAMENTO);
      const novosVagoesPorPos = Array.from({ length: numPos }, (_, idx) => {
        if (idx < cheios) return VAGOES_POR_POSICIONAMENTO;
        if (idx === cheios) return total % VAGOES_POR_POSICIONAMENTO || VAGOES_POR_POSICIONAMENTO;
        return 0;
      });
      setVagoesPorPos(novosVagoesPorPos);
    }
    // eslint-disable-next-line
  }, [numPos, qtdVagoes, confirmado]);

  // Handler para editar vagões por posicionamento
  const handleVagoesChange = (idx, value) => {
    const novo = [...vagoesPorPos];
    novo[idx] = Math.max(1, Math.min(value, qtdVagoes)); // mínimo 1, máximo qtdVagoes
    setVagoesPorPos(novo);
  };

  // Atualiza campos principais
  const handleChange = (campo, valor) => setDados(d => ({ ...d, [campo]: valor }));
  // Atualiza quantidade de vagões
  const handleQtdVagoesChange = (e) => {
    const qtd = Number(e.target.value);
    if (process.env.NODE_ENV === 'development') {
      console.log('=== ALTERANDO QUANTIDADE DE VAGÕES ===', { qtd, numPosAtual: calcularPosicionamentos(qtd) });
    }

    setDados(d => {
      const novosDados = {
        ...d,
        qtdVagoes: qtd,
        posicionamentos: Array.from({ length: calcularPosicionamentos(qtd) }, (_, i) => d.posicionamentos[i] || { tempoPuxada: '', tempoDescarga: '' })
      };
      if (process.env.NODE_ENV === 'development') {
        console.log('Novos dados após alteração:', novosDados);
      }
      return novosDados;
    });
  };
  // Atualiza tempos
  const handleTempoChange = (idx, campo, valor) => {
    setDados(d => ({
      ...d,
      posicionamentos: d.posicionamentos.map((p, i) => i === idx ? { ...p, [campo]: valor } : p)
    }));
  };
  // Atualiza motivo impacto
  const handleMotivoChange = (idx, campo, valor) => {
    setCronos(c => {
      if (!Array.isArray(c)) return c;
      return c.map((cr, i) => i === idx ? { ...cr, [campo]: valor } : cr);
    });
  };

  // Função para verificar se um posicionamento pode ser iniciado (sequencial)
  const podeIniciarPuxada = (idx) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Verificando se pode iniciar puxada posição ${idx}:`, {
        cronosArray: Array.isArray(cronos),
        cronosLength: Array.isArray(cronos) ? cronos.length : 'não é array',
        cronos: cronos
      });
    }

    if (!Array.isArray(cronos)) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ cronos não é um array');
      }
      return false;
    }

    // Primeiro posicionamento sempre pode iniciar
    if (idx === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Primeiro posicionamento, pode iniciar');
      }
      return true;
    }

    // Verifica se o posicionamento anterior foi completamente finalizado
    const anterior = cronos[idx - 1];
    if (process.env.NODE_ENV === 'development') {
      console.log(`Posição anterior ${idx - 1}:`, anterior);
    }

    const podeIniciar = anterior &&
      !anterior.puxadaAtivo &&
      anterior.puxadaTempo > 0 &&
      !anterior.descargaAtivo &&
      anterior.descargaTempo > 0;

    if (process.env.NODE_ENV === 'development') {
      console.log(`Pode iniciar puxada posição ${idx}?`, podeIniciar);
    }
    return podeIniciar;
  };

  const podeIniciarDescarga = (idx) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Verificando se pode iniciar descarga posição ${idx}:`, {
        cronosArray: Array.isArray(cronos),
        cronosLength: Array.isArray(cronos) ? cronos.length : 'não é array'
      });
    }

    if (!Array.isArray(cronos)) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ cronos não é um array');
      }
      return false;
    }

    const atual = cronos[idx];
    if (process.env.NODE_ENV === 'development') {
      console.log(`Cronômetro atual posição ${idx}:`, atual);
    }

    // Só pode iniciar descarga se a puxada do mesmo posicionamento foi finalizada
    const podeIniciar = atual &&
      !atual.puxadaAtivo &&
      atual.puxadaTempo > 0 &&
      !atual.descargaAtivo;

    if (process.env.NODE_ENV === 'development') {
      console.log(`Pode iniciar descarga posição ${idx}?`, podeIniciar);
    }
    return podeIniciar;
  };

  // Iniciar/finalizar puxada
  const iniciarPuxada = idx => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`=== INICIANDO PUXADA POSIÇÃO ${idx} ===`);
      console.log('Estado atual dos cronômetros:', cronos);
    }

    // Verifica se já está ativo para evitar chamadas duplicadas
    if (Array.isArray(cronos) && cronos[idx] && cronos[idx].puxadaAtivo) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`❌ Puxada da posição ${idx} já está ativa, ignorando chamada duplicada`);
      }
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Pode iniciar puxada?', podeIniciarPuxada(idx));
    }

    if (!podeIniciarPuxada(idx)) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`❌ Não pode iniciar puxada para posição ${idx}`);
      }
      return;
    }

    setCronos(c => {
      if (!Array.isArray(c)) {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ cronos não é um array!');
        }
        return c;
      }

      const novosCronos = c.map((cr, i) => {
        if (i === idx) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ Ativando puxada para posição ${idx}`);
          }
          return { ...cr, puxadaAtivo: true };
        }
        return cr;
      });

      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Cronômetros após iniciar puxada ${idx}:`, novosCronos);
      }
      return novosCronos;
    });
  };

  const finalizarPuxada = (idx, tempo) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`=== FINALIZANDO PUXADA POSIÇÃO ${idx} ===`);
      console.log('Tempo finalizado:', tempo);
    }
    const tempoMs = Number(tempo) || 0;
    const tempoImpacto = tempoMs > 20000 ? tempoMs - 20000 : 0; // Calcula tempo de impacto se excedeu 20 segundos
    if (process.env.NODE_ENV === 'development') {
      console.log('Tempo de impacto calculado:', tempoImpacto);
    }
    setCronos(c => {
      if (!Array.isArray(c)) return c;
      const novosCronos = c.map((cr, i) => i === idx ? {
        ...cr,
        puxadaAtivo: false,
        puxadaTempo: tempoMs,
        tempoImpactoPuxada: tempoImpacto
      } : cr);
      if (process.env.NODE_ENV === 'development') {
        console.log('Cronômetros após finalizar puxada:', novosCronos);
      }
      return novosCronos;
    });
    handleTempoChange(idx, 'tempoPuxada', msParaMinutosSegundos(tempoMs));
    // Inicia automaticamente o cronômetro de descarga após finalizar a puxada
    setTimeout(() => {
      if (podeIniciarDescarga(idx)) {
        iniciarDescarga(idx);
        setFeedback({ type: "info", message: `Posicionamento ${idx + 1}: Descarga iniciada automaticamente!` });
      }
    }, 100);
  };

  // Iniciar/finalizar descarga
  const iniciarDescarga = idx => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`=== INICIANDO DESCARGA POSIÇÃO ${idx} ===`);
      console.log('Estado atual dos cronômetros:', cronos);
    }

    // Verifica se já está ativo para evitar chamadas duplicadas
    if (Array.isArray(cronos) && cronos[idx] && cronos[idx].descargaAtivo) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`❌ Descarga da posição ${idx} já está ativa, ignorando chamada duplicada`);
      }
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Pode iniciar descarga?', podeIniciarDescarga(idx));
    }

    if (!podeIniciarDescarga(idx)) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`❌ Não pode iniciar descarga para posição ${idx}`);
      }
      return;
    }

    setCronos(c => {
      if (!Array.isArray(c)) {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ cronos não é um array!');
        }
        return c;
      }

      const novosCronos = c.map((cr, i) => {
        if (i === idx) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ Ativando descarga para posição ${idx}`);
          }
          return { ...cr, descargaAtivo: true };
        }
        return cr;
      });

      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Cronômetros após iniciar descarga ${idx}:`, novosCronos);
      }
      return novosCronos;
    });
  };

  const finalizarDescarga = (idx, tempo) => {
    if (cronos[idx]?.emTrocaDeTurno) {
      setFeedback({ type: 'warning', message: 'É necessário Retornar com a Descarga antes de finalizar!' });
      return;
    }
    if (process.env.NODE_ENV === 'development') {
      console.log(`=== FINALIZANDO DESCARGA POSIÇÃO ${idx} ===`);
      console.log('Tempo finalizado:', tempo);
    }
    const tempoMs = Number(tempo) || 0;
    const tempoImpacto = tempoMs > 60000 ? tempoMs - 60000 : 0; // Calcula tempo de impacto se excedeu 1 minuto
    if (process.env.NODE_ENV === 'development') {
      console.log('Tempo de impacto calculado:', tempoImpacto);
    }
    setCronos(c => {
      if (!Array.isArray(c)) return c;
      const novosCronos = c.map((cr, i) => {
        if (i === idx) {
          // Garante que descargaAtivo sempre será false e tempo preenchido
          return {
            ...cr,
            descargaAtivo: false,
            descargaTempo: tempoMs,
            tempoImpactoDescarga: tempoImpacto
          };
        }
        return cr;
      });
      if (process.env.NODE_ENV === 'development') {
        console.log('Cronômetros após finalizar descarga:', novosCronos);
      }
      setTimeout(() => salvarComposicaoEmAndamento(), 100);
      return novosCronos;
    });
    handleTempoChange(idx, 'tempoDescarga', msParaMinutosSegundos(tempoMs));
    // Inicia automaticamente o próximo posicionamento se existir
    setTimeout(() => {
      if (idx + 1 < numPos && podeIniciarPuxada(idx + 1)) {
        iniciarPuxada(idx + 1);
        setFeedback({ type: "info", message: `Posicionamento ${idx + 2}: Puxada iniciada automaticamente!` });
      }
    }, 100);
  };
  // Excedeu limite
  const onExcedeuPuxada = idx => setCronos(c => {
    if (!Array.isArray(c)) return c;
    return c.map((cr, i) => i === idx ? { ...cr, puxadaExcedeu: true } : cr);
  });
  const onExcedeuDescarga = idx => setCronos(c => {
    if (!Array.isArray(c)) return c;
    return c.map((cr, i) => i === idx ? { ...cr, descargaExcedeu: true } : cr);
  });

  // Detecta se todos os posicionamentos foram finalizados (todos os tempos de descarga preenchidos)
  useEffect(() => {
    // Verificação de segurança para garantir que cronos seja um array
    if (!Array.isArray(cronos)) {
      if (process.env.NODE_ENV === 'development') {
        console.log('cronos não é um array, ignorando verificação');
      }
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Verificando se deve salvar:', {
        confirmado,
        qtdVagoes,
        cronosLength: cronos.length,
        numPos,
        todosFinalizados: cronos.every(c => c && !c.descargaAtivo && c.descargaTempo > 0),
        cronos: cronos.map(c => c ? { descargaAtivo: c.descargaAtivo, descargaTempo: c.descargaTempo } : null).filter(Boolean)
      });
    }

    if (
      confirmado &&
      qtdVagoes > 0 &&
      cronos.length === numPos &&
      cronos.every(c => c && !c.descargaAtivo && c.descargaTempo > 0)
    ) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Condições atendidas, salvando composição...');
      }
      setMostrarResumo(true);
      // Salvar automaticamente a composição descarregada
      salvarComposicaoDescarregada();
    }
  }, [cronos, confirmado, qtdVagoes, numPos]);

  // Função para salvar a composição descarregada no Firebase
  const salvarComposicaoDescarregada = async () => {
    if (salvando) return;

    setSalvando(true);
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('💾 Iniciando salvamento de composição...');
        console.log('📊 Dados da moega:', { moega, produto, armazem, qtdVagoes });
        console.log('⏰ Cronômetros:', cronos);
      }

      // Corrigir todos os cronos e posicionamentos antes de salvar
      let cronosCorrigidos = Array.isArray(cronos) ? cronos.map(c => ({
        ...c,
        descargaAtivo: false,
        descargaTempo: Number(c.descargaTempo) > 0 ? c.descargaTempo : 60000 // valor padrão se não preenchido
      })) : [];
      let posicionamentosCorrigidos = Array.isArray(posicionamentos) ? posicionamentos.map(p => ({
        ...p,
        descargaAtivo: false,
        descargaTempo: Number(p.descargaTempo) > 0 ? p.descargaTempo : 60000
      })) : [];
      // Salvar composição descarregada
      const composicaoParaSalvar = {
        moega,
        produto,
        armazem,
        qtdVagoes,
        inicio,
        maquinista,
        operador,
        data: new Date().toISOString().split('T')[0],
        dataHoraSalvamento: new Date().toISOString(),
        tipo: 'composicao_descarregada',
        cronos: cronosCorrigidos,
        posicionamentos: posicionamentosCorrigidos,
      };

      if (process.env.NODE_ENV === 'development') {
        console.log('📝 Dados para salvar:', composicaoParaSalvar);
        console.log('🚀 Executando addDoc...');
      }

      const docRef = await addDoc(collection(db, "composicoes_descarregadas"), composicaoParaSalvar);
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Composição salva com sucesso:', docRef.id);
      }

      // Mostrar feedback de sucesso
      setFeedback({ type: "success", message: "Composição descarregada salva automaticamente no sistema!" });

      // Após salvar, remover de composicoes_em_andamento
      try {
        const idUnico = gerarIdUnicoComposicao(moega, composicaoParaSalvar.data, inicio);
        await deleteDoc(doc(db, "composicoes_em_andamento", idUnico));
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Erro ao remover composição em andamento:', e);
        }
      }

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Erro detalhado ao salvar composição:', {
          message: error.message,
          code: error.code,
          stack: error.stack,
          name: error.name
        });
      }

      // Tratamento específico para diferentes tipos de erro
      if (error.code === 'permission-denied') {
        if (process.env.NODE_ENV === 'development') {
          console.error('🔒 Erro de permissão - verificar regras do Firestore');
        }
        setFeedback({ type: "error", message: "Erro de permissão ao salvar dados. Verifique as regras do Firestore." });
      } else if (error.code === 'unavailable') {
        if (process.env.NODE_ENV === 'development') {
          console.error('🌐 Serviço indisponível - verificar conectividade');
        }
        setFeedback({ type: "error", message: "Serviço temporariamente indisponível. Verifique sua conexão." });
      } else if (error.code === 'invalid-argument') {
        if (process.env.NODE_ENV === 'development') {
          console.error('⚠️ Argumento inválido nos dados');
        }
        setFeedback({ type: "error", message: "Erro nos dados enviados. Verifique se todos os campos estão corretos." });
      } else if (error.code === 'resource-exhausted') {
        if (process.env.NODE_ENV === 'development') {
          console.error('�� Limite de recursos excedido');
        }
        setFeedback({ type: "error", message: "Limite de recursos excedido. Tente novamente mais tarde." });
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.error('❓ Erro desconhecido:', error);
        }
        setFeedback({ type: "error", message: `Erro ao salvar composição: ${error.message}` });
      }
    } finally {
      setSalvando(false);
    }
  };

  // Função para resetar o sistema e permitir nova composição
  const resetarSistema = () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Resetando sistema para nova composição...');
    }
    setDados({
      produto: '',
      qtdVagoes: 0,
      posicionamentos: [],
      armazem: '',
      inicio: '',
      maquinista: '',
      operador: '',
      cronos: [],
      confirmado: false,
      mostrarResumo: false,
      selecionados: [],
      vagoesPorPos: [],
      salvando: false
    });
    setFeedback({ type: "info", message: "Sistema resetado. Você pode iniciar uma nova composição." });
  };

  // Cálculo do TMD
  function calcularTMD() {
    if (!Array.isArray(cronos)) return '00:00';
    // O TMD deve ser a média dos tempos de descarga, sem descontar trocas de turno
    const tempos = cronos.map(c => (c && c.descargaTempo > 0 ? c.descargaTempo : 0)).filter(t => t > 0);
    if (tempos.length === 0) return '00:00';
    const mediaMs = tempos.reduce((a, b) => a + b, 0) / tempos.length;
    return msParaMinutosSegundos(mediaMs);
  }

  // Calcular horário de fim
  function calcularHorarioFim() {
    if (!inicio || !Array.isArray(cronos)) return '';
    const inicioDate = new Date(`2000-01-01T${inicio}`);
    const tempoTotalMs = cronos.reduce((acc, c) => acc + (c ? c.descargaTempo : 0), 0);
    const fimDate = new Date(inicioDate.getTime() + tempoTotalMs);
    return fimDate.toTimeString().slice(0, 5);
  }

  // Calcular tempo total da descarga
  function calcularTempoTotal() {
    if (!Array.isArray(cronos)) return '00:00';
    const tempoTotalMs = cronos.reduce((acc, c) => acc + (c ? c.descargaTempo : 0), 0);
    return msParaMinutosSegundos(tempoTotalMs);
  }

  // Calcular tempo total de puxada
  function calcularTempoTotalPuxada() {
    if (!Array.isArray(cronos)) return '00:00';
    const tempoTotalMs = cronos.reduce((acc, c) => acc + (c ? c.puxadaTempo : 0), 0);
    return msParaMinutosSegundos(tempoTotalMs);
  }

  // Calcular impactos totais
  function calcularImpactosTotais() {
    if (!Array.isArray(cronos)) return { puxada: 0, descarga: 0 };
    const impactosPuxada = cronos.filter(c => c && c.tempoImpactoPuxada > 0).length;
    const impactosDescarga = cronos.filter(c => c && c.tempoImpactoDescarga > 0).length;
    return { puxada: impactosPuxada, descarga: impactosDescarga };
  }

  // Função para calcular vagões por posicionamento
  function vagoesNoPosicionamento(idx) {
    const total = qtdVagoes || 0;
    const cheios = Math.floor(total / VAGOES_POR_POSICIONAMENTO);
    if (idx < cheios) return VAGOES_POR_POSICIONAMENTO;
    if (idx === cheios) return total % VAGOES_POR_POSICIONAMENTO || VAGOES_POR_POSICIONAMENTO;
    return 0;
  }

  // Função para exportar selecionados em PDF
  const exportarSelecionadosPDF = () => {
    try {
      if (!Array.isArray(selecionados) || selecionados.length === 0) {
        setFeedback({ type: 'info', message: 'Nenhum posicionamento selecionado para exportar.' });
        return;
      }
      const doc = new jsPDF();
      const dataHora = new Date().toLocaleString();
      // --- FAIXA AZUL SUAVE NO TOPO ---
      doc.setFillColor(232, 244, 253); // azul bem claro
      doc.rect(0, 0, 210, 30, 'F');
      // --- CABEÇALHO ESTILIZADO ---
      doc.setFontSize(20);
      doc.setTextColor(25, 118, 210); // Azul VLI
      doc.text('Sistema Inteligente de Descarga VLI', 105, 18, { align: 'center' });
      doc.setFontSize(12);
      doc.setTextColor(67, 176, 42); // Verde VLI
      doc.text('Relatório H/H - Resumo Parcial', 105, 27, { align: 'center' });
      // --- SLOGAN INSTITUCIONAL ---
      doc.setFontSize(10);
      doc.setTextColor(25, 118, 210);
      doc.text('VLI – Inovação, Segurança e Eficiência', 105, 33, { align: 'center' });
      doc.setDrawColor(25, 118, 210);
      doc.setLineWidth(1.2);
      doc.line(20, 36, 190, 36); // linha divisória
      // --- TÍTULO DADOS OPERACIONAIS COM ÍCONE ---
      let y = 44;
      doc.setFontSize(14);
      doc.setTextColor(25, 118, 210);
      doc.text('📋 DADOS OPERACIONAIS', 14, y);
      y += 3;
      doc.setDrawColor(67, 176, 42);
      doc.setLineWidth(0.7);
      doc.line(14, y + 1, 80, y + 1); // linha curta abaixo do título
      y += 7;
      // --- DADOS OPERACIONAIS ---
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`Moega: ${moega}`, 14, y); y += 6;
      doc.text(`Produto: ${produto}`, 14, y); y += 6;
      doc.text(`Armazém: ${armazem}`, 14, y); y += 6;
      doc.text(`Maquinista: ${maquinista}`, 14, y); y += 6;
      const totalVagoes = Array.isArray(selecionados) ? selecionados.reduce((acc, idx) => acc + (vagoesPorPos[idx] || 0), 0) : 0;
      doc.text(`Qtd Vagões (selecionados): ${totalVagoes}`, 14, y); y += 6;
      doc.text(`Horário de Início: ${inicio}`, 14, y); y += 6;
      doc.text(`Data/Hora do relatório: ${dataHora}`, 14, y); y += 8;
      // --- LINHA DIVISÓRIA ANTES DA TABELA ---
      doc.setDrawColor(25, 118, 210);
      doc.setLineWidth(0.5);
      doc.line(12, y, 198, y);
      y += 6;
      // --- TÍTULO TABELA H/H COM ÍCONE ---
      doc.setFontSize(13);
      doc.setTextColor(25, 118, 210);
      doc.text('⏱️ TABELA H/H', 14, y);
      y += 3;
      doc.setDrawColor(25, 118, 210);
      doc.setLineWidth(0.5);
      doc.line(14, y + 1, 80, y + 1);
      y += 7;
      // --- TABELA H/H ---
      const tableData = Array.isArray(cronos) && Array.isArray(selecionados) ? selecionados.map(idx => {
        const crono = cronos[idx];
        if (!crono) return null;
        return [
          idx + 1,
          vagoesPorPos[idx] || 0,
          msParaMinutosSegundos(crono.puxadaTempo || 0),
          crono.puxadaExcedeu && crono.tempoImpactoPuxada > 0 ? `${msParaMinutosSegundos(crono.tempoImpactoPuxada)} ${crono.motivoImpactoPuxada || ''}` : '-',
          msParaMinutosSegundos(crono.descargaTempo || 0),
          crono.descargaExcedeu && crono.tempoImpactoDescarga > 0 ? `${msParaMinutosSegundos(crono.tempoImpactoDescarga)} ${crono.motivoImpactoDescarga || ''}${crono.motivoImpactoDescargaAdicional ? ` / ${crono.motivoImpactoDescargaAdicional}` : ''}` : '-',
          Array.isArray(crono.trocasDeTurno) && crono.trocasDeTurno.length > 0
            ? crono.trocasDeTurno.map(t => `${t.inicio}${t.fim ? ` até ${t.fim} (${Math.round((t.duracaoMs || 0) / 60000)} min)` : ' (em andamento...)'}`).join('; ')
            : '-'
        ];
      }).filter(Boolean) : [];
      autoTable(doc, {
        head: [['Pos', 'Vagões', 'Puxada', 'Impacto Puxada', 'Descarga', 'Impacto Descarga', 'Trocas de Turno']],
        body: tableData,
        startY: y,
        styles: {
          fontSize: 11,
          cellPadding: 2.5,
          halign: 'center',
          valign: 'middle',
          lineWidth: 0.3,
          lineColor: [200, 200, 200],
          textColor: [33, 33, 33],
          minCellHeight: 9,
        },
        headStyles: {
          fillColor: [25, 118, 210],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 12,
          halign: 'center',
          valign: 'middle',
          lineWidth: 0.7,
          lineColor: [25, 118, 210],
        },
        alternateRowStyles: { fillColor: [240, 240, 240] },
        tableLineColor: [25, 118, 210],
        tableLineWidth: 0.5,
        margin: { left: 12, right: 12 },
        didDrawPage: function (data) {
          // --- RODAPÉ INSTITUCIONAL ---
          const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
          doc.setFontSize(10);
          doc.setTextColor(25, 118, 210);
          doc.text('VLI – Inovação, Segurança e Eficiência', 105, pageHeight - 12, { align: 'center' });
          doc.setFontSize(8);
          doc.setTextColor(120, 120, 120);
          doc.text(`© ${new Date().getFullYear()} VLI. Todos os direitos reservados.`, 105, pageHeight - 6, { align: 'center' });
        }
      });
      // --- BOX DE RESUMO ---
      let afterTableY = doc.lastAutoTable.finalY + 8;
      // Calcular TMD e impactos
      const tmd = (() => {
        if (!Array.isArray(cronos)) return '00:00';
        const tempos = selecionados.map(idx => {
          const c = cronos[idx];
          return c && c.descargaTempo > 0 ? c.descargaTempo : 0;
        }).filter(t => t > 0);
        if (tempos.length === 0) return '00:00';
        const mediaMs = tempos.reduce((a, b) => a + b, 0) / tempos.length;
        return msParaMinutosSegundos(mediaMs);
      })();
      const impactos = (() => {
        if (!Array.isArray(cronos)) return { puxada: 0, descarga: 0 };
        const impactosPuxada = selecionados.filter(idx => cronos[idx] && cronos[idx].tempoImpactoPuxada > 0).length;
        const impactosDescarga = selecionados.filter(idx => cronos[idx] && cronos[idx].tempoImpactoDescarga > 0).length;
        return { puxada: impactosPuxada, descarga: impactosDescarga };
      })();
      // Eficiência
      let eficiencia = '';
      if (impactos.puxada + impactos.descarga === 0) {
        eficiencia = '100% (Sem impactos)';
      } else {
        eficiencia = 'Com impactos registrados';
      }
      doc.setDrawColor(67, 176, 42);
      doc.setFillColor(232, 245, 233); // verde bem claro
      doc.roundedRect(14, afterTableY, 180, 28, 4, 4, 'F');
      doc.setFontSize(12);
      doc.setTextColor(25, 118, 210);
      doc.text('📊 Resumo Selecionados', 24, afterTableY + 8);
      doc.setFontSize(10);
      doc.setTextColor(33, 33, 33);
      doc.text(`Total de Vagões: ${totalVagoes}`, 24, afterTableY + 15);
      doc.text(`TMD (Tempo Médio Descarga): ${tmd}`, 80, afterTableY + 15);
      doc.text(`Impactos: Puxada ${impactos.puxada} | Descarga ${impactos.descarga}`, 140, afterTableY + 15);
      doc.setFontSize(10);
      doc.setTextColor(67, 176, 42);
      doc.text(`Eficiência: ${eficiencia}`, 24, afterTableY + 22);
      doc.save(`Resumo_Parcial_${moega}.pdf`);
      setFeedback({ type: 'success', message: 'PDF exportado com sucesso!' });
    } catch (e) {
      setFeedback({ type: 'error', message: 'Erro ao exportar PDF: ' + e.message });
    }
  };

  // Função para exportar PDF final (descarga completa)
  const exportarResumoPDF = async () => {
    try {
      const doc = new jsPDF();
      const dataHora = new Date().toLocaleString();
      const tempoTotal = calcularTempoTotal();
      const tempoTotalPuxada = calcularTempoTotalPuxada();
      const horarioFim = calcularHorarioFim();
      const impactos = calcularImpactosTotais();

      // Cabeçalho
      doc.setFontSize(18);
      doc.setTextColor(25, 118, 210);
      doc.text('RELATÓRIO FINAL DE DESCARGA', 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Gerado em: ${dataHora}`, 14, 30);
      doc.text(`Moega: ${moega}`, 14, 40);

      // Dados Operacionais
      doc.setFontSize(14);
      doc.setTextColor(25, 118, 210);
      doc.text('DADOS OPERACIONAIS', 14, 55);

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Produto: ${produto}`, 14, 65);
      doc.text(`Armazém: ${armazem}`, 14, 72);
      doc.text(`Maquinista: ${maquinista}`, 14, 79);
      doc.text(`Quantidade de Vagões: ${qtdVagoes}`, 14, 86);

      // Cronograma
      doc.setFontSize(14);
      doc.setTextColor(25, 118, 210);
      doc.text('CRONOGRAMA', 14, 100);

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Início: ${inicio}`, 14, 110);
      doc.text(`Fim: ${horarioFim}`, 14, 117);
      doc.text(`Tempo Total: ${tempoTotal}`, 14, 124);
      doc.text(`Tempo Total Puxada: ${tempoTotalPuxada}`, 14, 131);
      doc.text(`TMD (Tempo Médio Descarga): ${calcularTMD()}`, 14, 138);

      // Estatísticas de Impacto
      doc.setFontSize(14);
      doc.setTextColor(255, 152, 0);
      doc.text('ESTATÍSTICAS DE IMPACTO', 14, 152);

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Impactos na Puxada: ${impactos.puxada}`, 14, 162);
      doc.text(`Impactos na Descarga: ${impactos.descarga}`, 14, 169);

      // Tabela de Posicionamentos
      const tableData = Array.isArray(cronos) ? cronos.map((c, i) => {
        if (!c) return null;
        return [
          i + 1,
          vagoesPorPos[i] || 0,
          msParaMinutosSegundos(c.puxadaTempo || 0),
          c.puxadaExcedeu && c.tempoImpactoPuxada > 0 ? `+${msParaMinutosSegundos(c.tempoImpactoPuxada)}` : '-',
          msParaMinutosSegundos(c.descargaTempo || 0),
          c.descargaExcedeu && c.tempoImpactoDescarga > 0 ? `+${msParaMinutosSegundos(c.tempoImpactoDescarga)}` : '-',
          c.puxadaExcedeu && c.tempoImpactoPuxada > 0 ? c.motivoImpactoPuxada || 'Sem motivo' : '-',
          c.descargaExcedeu && c.tempoImpactoDescarga > 0 ?
            `${c.motivoImpactoDescarga || 'Sem motivo'}${c.motivoImpactoDescargaAdicional ? ` / ${c.motivoImpactoDescargaAdicional}` : ''}` : '-',
          (c.puxadaTempo || 0) > 0 && (c.descargaTempo || 0) > 0 ? 'CONCLUÍDO' : 'EM ANDAMENTO'
        ];
      }).filter(Boolean) : [];

      autoTable(doc, {
        head: [['Pos', 'Vagões', 'Puxada', 'Impacto Puxada', 'Descarga', 'Impacto Descarga', 'Motivo Puxada', 'Motivo Descarga', 'Trocas de Turno', 'Status']],
        body: tableData,
        startY: 180,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: {
          fillColor: [25, 118, 210],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: { fillColor: [248, 249, 250] },
        columnStyles: {
          0: { cellWidth: 15 }, // Pos
          1: { cellWidth: 20 }, // Vagões
          2: { cellWidth: 25 }, // Puxada
          3: { cellWidth: 25 }, // Impacto Puxada
          4: { cellWidth: 25 }, // Descarga
          5: { cellWidth: 25 }, // Impacto Descarga
          6: { cellWidth: 30 }, // Motivo Puxada
          7: { cellWidth: 35 }, // Motivo Descarga
          8: { cellWidth: 25 }, // Trocas de Turno
          9: { cellWidth: 25 }  // Status
        }
      });

      // Resumo Final
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.setTextColor(25, 118, 210);
      doc.text('RESUMO FINAL', 14, finalY);

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`• Tempo total de operação: ${tempoTotal}`, 14, finalY + 10);
      doc.text(`• Tempo médio por posicionamento: ${calcularTMD()}`, 14, finalY + 17);
      doc.text(`• Total de impactos registrados: ${impactos.puxada + impactos.descarga}`, 14, finalY + 24);
      doc.text(`• Eficiência: ${impactos.puxada + impactos.descarga === 0 ? '100% (Sem impactos)' : 'Com impactos registrados'}`, 14, finalY + 31);

      doc.save(`Relatorio_Final_${moega}_${new Date().toISOString().slice(0, 10)}.pdf`);
      setFeedback({ type: 'success', message: 'PDF exportado com sucesso!' });
    } catch (e) {
      setFeedback({ type: 'error', message: 'Erro ao exportar PDF: ' + e.message });
    }
  };

  // Função para compartilhar o resumo via WhatsApp
  const compartilharWhatsApp = () => {
    const tmd = calcularTMD();
    const tempoTotal = calcularTempoTotal();
    const tempoTotalPuxada = calcularTempoTotalPuxada();
    const horarioFim = calcularHorarioFim();
    const impactos = calcularImpactosTotais();

    const texto = [
      `*📋 RELATÓRIO FINAL DE DESCARGA*`,
      ``,
      `*📊 DADOS OPERACIONAIS*`,
      `Moega: ${moega}`,
      `Produto: ${produto}`,
      `Armazém: ${armazem}`,
      `Maquinista: ${maquinista}`,
      `Qtd Vagões: ${qtdVagoes}`,
      ``,
      `*⏰ CRONOGRAMA*`,
      `Início: ${inicio}`,
      `Fim: ${horarioFim}`,
      `Tempo Total: ${tempoTotal}`,
      `Tempo Total Puxada: ${tempoTotalPuxada}`,
      `TMD: ${tmd}`,
      ``,
      `*⚠️ ESTATÍSTICAS DE IMPACTO*`,
      `Impactos na Puxada: ${impactos.puxada}`,
      `Impactos na Descarga: ${impactos.descarga}`,
      ``,
      `*📋 DETALHAMENTO POR POSICIONAMENTO*`,
      `Pos | Vagões | Puxada | Descarga | Impactos`,
      `--- | ------ | ------ | -------- | --------`,
      ...(Array.isArray(cronos) ? cronos.map((c, i) => {
        if (!c) return null;
        const puxadaImpacto = c.puxadaExcedeu && c.tempoImpactoPuxada > 0 ? `+${msParaMinutosSegundos(c.tempoImpactoPuxada)}` : '';
        const descargaImpacto = c.descargaExcedeu && c.tempoImpactoDescarga > 0 ? `+${msParaMinutosSegundos(c.tempoImpactoDescarga)}` : '';
        const impactos = [];
        if (c.puxadaExcedeu && c.tempoImpactoPuxada > 0) impactos.push(`P:${c.motivoImpactoPuxada || 'Sem motivo'}`);
        if (c.descargaExcedeu && c.tempoImpactoDescarga > 0) impactos.push(`D:${c.motivoImpactoDescarga || 'Sem motivo'}`);

        return `${i + 1} | ${vagoesPorPos[i] || 0} | ${msParaMinutosSegundos(c.puxadaTempo || 0)}${puxadaImpacto} | ${msParaMinutosSegundos(c.descargaTempo || 0)}${descargaImpacto} | ${impactos.join(', ') || '-'}`;
      }).filter(Boolean) : [])
    ].join('\n');
    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  // Atualiza seleção de posicionamentos
  const handleSelecionar = idx => {
    if (!Array.isArray(cronos) || !cronos[idx] || cronos[idx].descargaTempo === 0) return;
    setDados(d => {
      const selecaoAtual = Array.isArray(d.selecionados) ? d.selecionados : [];
      return {
        ...d,
        selecionados: selecaoAtual.includes(idx)
          ? selecaoAtual.filter(i => i !== idx)
          : [...selecaoAtual, idx]
      };
    });
  };

  // Função para salvar composição em andamento
  const salvarComposicaoEmAndamento = async () => {
    if (salvando) return;

    setSalvando(true);
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('💾 Salvando composição em andamento...');
      }

      // Corrigir o último crono se necessário
      let cronosCorrigidos = Array.isArray(cronos) ? [...cronos] : [];
      if (cronosCorrigidos.length > 0) {
        const lastIdx = cronosCorrigidos.length - 1;
        if (cronosCorrigidos[lastIdx] && Number(cronosCorrigidos[lastIdx].descargaTempo) > 0) {
          cronosCorrigidos[lastIdx] = {
            ...cronosCorrigidos[lastIdx],
            descargaAtivo: false
          };
        }
      }
      // Usar cronosCorrigidos no objeto salvo
      const composicaoParaSalvar = {
        moega,
        produto,
        armazem,
        qtdVagoes,
        inicio,
        maquinista,
        operador,
        data: new Date().toISOString().split('T')[0],
        dataHoraSalvamento: new Date().toISOString(),
        tipo: 'composicao_em_andamento',
        status: 'em_andamento',
        cronos: cronosCorrigidos, // Salva o array de cronômetros completo
        posicionamentos: Array.isArray(cronos) ? cronos.map((c, i) => {
          if (!c) return null;
          return {
            posicao: i + 1,
            vagoes: vagoesPorPos[i] || 0,
            puxadaTempo: c.puxadaTempo || 0,
            descargaTempo: c.descargaTempo || 0,
            puxadaAtivo: c.puxadaAtivo || false,
            descargaAtivo: c.descargaAtivo || false,
            puxadaExcedeu: c.puxadaExcedeu || false,
            descargaExcedeu: c.descargaExcedeu || false,
            tempoImpactoPuxada: c.tempoImpactoPuxada || 0,
            tempoImpactoDescarga: c.tempoImpactoDescarga || 0,
            motivoImpactoPuxada: c.motivoImpactoPuxada || '',
            motivoImpactoDescarga: c.motivoImpactoDescarga || '',
            motivoImpactoDescargaAdicional: c.motivoImpactoDescargaAdicional || ''
          };
        }).filter(Boolean) : [],
        vagoesPorPos: vagoesPorPos,
        selecionados: selecionados
      };

      if (process.env.NODE_ENV === 'development') {
        console.log('📝 Dados para salvar:', composicaoParaSalvar);
      }
      // Gera um ID único para a composição em andamento
      const idUnico = gerarIdUnicoComposicao(moega, composicaoParaSalvar.data, inicio);
      await setDoc(doc(db, "composicoes_em_andamento", idUnico), composicaoParaSalvar, { merge: true });
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Composição em andamento salva/atualizada:', idUnico);
      }
      setFeedback({ type: "success", message: "Composição salva automaticamente!" });

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Erro ao salvar composição em andamento:', error);
      }
      setFeedback({ type: "error", message: "Erro ao salvar composição: " + error.message });
    } finally {
      setSalvando(false);
    }
  };

  // Função para compartilhar selecionados via WhatsApp
  const compartilharSelecionadosWhatsApp = () => {
    if (!Array.isArray(selecionados) || selecionados.length === 0) return;
    const tmd = calcularTMD();
    const selecionadosCronos = Array.isArray(cronos) && Array.isArray(selecionados) ? selecionados.map(idx => cronos[idx]).filter(Boolean) : [];
    const qtdVagoesSelecionados = Array.isArray(selecionados) ? selecionados.reduce((acc, idx) => acc + (vagoesPorPos[idx] || 0), 0) : 0;
    let texto = [
      `*Resumo Parcial da Descarga*`,
      `Moega: ${moega}`,
      `Produto: ${produto}`,
      `Armazém: ${armazem}`,
      `Maquinista: ${maquinista}`,
      `Operador: ${operador}`,
      `Qtd Vagões (selecionados): ${qtdVagoesSelecionados}`,
      `Horário de Início: ${inicio}`,
      `Data/Hora do relatório: ${new Date().toLocaleString()}`,
      '',
      'Pos | Vagões | Puxada | Impacto Puxada | Descarga | Impacto Descarga',
      '--- | ------ | ------ | -------------- | -------- | ----------------',
      ...(Array.isArray(cronos) && Array.isArray(selecionados) ? selecionados.map(idx => {
        const crono = cronos[idx];
        if (!crono) return null;
        const puxadaImpacto = crono.puxadaExcedeu && crono.tempoImpactoPuxada > 0 ? `${msParaMinutosSegundos(crono.tempoImpactoPuxada)} ${crono.motivoImpactoPuxada || ''}` : '-';
        const descargaImpacto = crono.descargaExcedeu && crono.tempoImpactoDescarga > 0 ? `${msParaMinutosSegundos(crono.tempoImpactoDescarga)} ${crono.motivoImpactoDescarga || ''}${crono.motivoImpactoDescargaAdicional ? ` / ${crono.motivoImpactoDescargaAdicional}` : ''}` : '-';
        return `${idx + 1} | ${vagoesPorPos[idx] || 0} | ${msParaMinutosSegundos(crono.puxadaTempo || 0)} | ${puxadaImpacto} | ${msParaMinutosSegundos(crono.descargaTempo || 0)} | ${descargaImpacto}`;
      }).filter(Boolean) : [])
    ].join('\n');
    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  useEffect(() => {
    if (!Array.isArray(cronos)) return;
    // Iniciar descarga automaticamente se alguma puxada acabou de ser finalizada
    cronos.forEach((cr, idx) => {
      if (
        cr &&
        !cr.puxadaAtivo &&
        cr.puxadaTempo > 0 &&
        !cr.descargaAtivo &&
        cr.descargaTempo === 0 &&
        podeIniciarDescarga(idx)
      ) {
        iniciarDescarga(idx);
        setFeedback({ type: "info", message: `Posicionamento ${idx + 1}: Descarga iniciada automaticamente!` });
      }
    });
    // Iniciar próxima puxada automaticamente após finalizar descarga
    cronos.forEach((cr, idx) => {
      if (
        cr &&
        !cr.descargaAtivo &&
        cr.descargaTempo > 0 &&
        idx + 1 < numPos &&
        podeIniciarPuxada(idx + 1) &&
        cronos[idx + 1] &&
        !cronos[idx + 1].puxadaAtivo &&
        cronos[idx + 1].puxadaTempo === 0
      ) {
        iniciarPuxada(idx + 1);
        setFeedback({ type: "info", message: `Posicionamento ${idx + 2}: Puxada iniciada automaticamente!` });
      }
    });
    // Salvar composição em andamento após finalizar descarga
    if (
      cronos.some(cr => cr && !cr.descargaAtivo && cr.descargaTempo > 0) &&
      !salvando
    ) {
      salvarComposicaoEmAndamento();
    }
  }, [cronos]);

  // useEffect para salvar composição em andamento somente quando todos os cronos estiverem finalizados
  useEffect(() => {
    if (!Array.isArray(cronos) || cronos.length === 0) return;
    const todosFinalizados = cronos.every(c => c && !c.descargaAtivo && Number(c.descargaTempo) > 0);
    if (todosFinalizados) {
      salvarComposicaoEmAndamento();
    }
  }, [cronos]);

  // Adicione as funções de troca de turno dentro do MoegaCard:
  function iniciarTrocaDeTurno(idx) {
    setCronos(crs => crs.map((c, i) => {
      if (i !== idx) return { ...c };
      return {
        ...c,
        descargaAtivo: false, // Pausa o cronômetro de descarga
        emTrocaDeTurno: true,
        trocasDeTurno: [
          ...(c.trocasDeTurno || []),
          { inicio: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), fim: null, duracaoMs: null }
        ]
      };
    }));
  }
  function finalizarTrocaDeTurno(idx) {
    setCronos(crs => crs.map((c, i) => {
      if (i !== idx) return c;
      const trocas = [...(c.trocasDeTurno || [])];
      if (trocas.length === 0) return c;
      const ultima = trocas[trocas.length - 1];
      if (ultima.fim) return c; // já finalizada
      const fim = new Date();
      const inicioParts = ultima.inicio.split(':');
      const inicioDate = new Date();
      inicioDate.setHours(parseInt(inicioParts[0], 10));
      inicioDate.setMinutes(parseInt(inicioParts[1], 10));
      inicioDate.setSeconds(0);
      const duracaoMs = fim - inicioDate;
      const novaUltima = {
        ...ultima,
        fim: fim.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duracaoMs
      };
      const novasTrocas = [...trocas.slice(0, -1), novaUltima];
      return { ...c, descargaAtivo: true, emTrocaDeTurno: false, trocasDeTurno: novasTrocas };
    }));
  }

  return (
    <Paper style={{ marginBottom: 24 }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 2 }}>
        {/* Menu estilizado para seleção de produto */}
        <ul className="acorh" style={{ width: 200, margin: 0, marginRight: 16, display: 'inline-block', verticalAlign: 'middle' }}>
          <li>
            <a href="#" style={{ cursor: confirmado ? 'not-allowed' : 'pointer', opacity: confirmado ? 0.6 : 1 }}>
              {produto || 'Selecione o Produto'}
            </a>
            {!confirmado && (
              <ul>
                {PRODUTOS.map(p => (
                  <li key={p}>
                    <a href="#" onClick={e => { e.preventDefault(); setDados(d => ({ ...d, produto: p })); }}>{p}</a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        </ul>
        {/* Removido menu estilizado para seleção de moega daqui */}
        {/* O menu de moega fica apenas no componente principal */}
        {/* ...restante dos inputs e controles do MoegaCard... */}
        <MuiTextField
          label="Armazém"
          value={armazem || ''}
          onChange={e => handleChange('armazem', e.target.value)}
          sx={{ minWidth: 120 }}
          disabled={confirmado}
        />
        <MuiTextField
          label="Horário de Início"
          type="time"
          value={inicio || ''}
          onChange={e => handleChange('inicio', e.target.value)}
          sx={{ minWidth: 120 }}
          disabled={confirmado}
          InputLabelProps={{ shrink: true }}
        />
        <MuiTextField
          label="Maquinista"
          value={maquinista || ''}
          onChange={e => handleChange('maquinista', e.target.value)}
          sx={{ minWidth: 120 }}
          disabled={confirmado}
        />
        <MuiTextField
          label="Operador"
          value={operador || ''}
          onChange={e => handleChange('operador', e.target.value)}
          sx={{ minWidth: 120 }}
          disabled={confirmado}
          placeholder="Seu nome"
        />
        <MuiTextField
          type="number"
          label="Qtd Vagões"
          value={qtdVagoes}
          onChange={handleQtdVagoesChange}
          sx={{ minWidth: 120 }}
          inputProps={{ min: 0 }}
          disabled={confirmado}
        />
        {!confirmado && (
          <MuiButton
            variant="contained"
            color="primary"
            onClick={async () => {
              setConfirmado(true);
              // Salvar composição automaticamente ao confirmar
              await salvarComposicaoEmAndamento();
            }}
            sx={{ minWidth: 150 }}
          >
            Confirmar Dados
          </MuiButton>
        )}
      </Stack>
      {confirmado && qtdVagoes > 0 && (
        <>
          <Paper elevation={3} sx={{ mt: 2, p: 2, background: 'linear-gradient(90deg, #e3f2fd 0%, #bbdefb 100%)', border: '1.5px solid #90caf9', borderRadius: 4, boxShadow: '0 8px 32px rgba(25, 118, 210, 0.13)', mb: 2 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              ⚠️ FLUXO SEQUENCIAL: Os posicionamentos devem ser executados em ordem. Só é possível iniciar o próximo após finalizar o anterior.
            </Typography>
          </Paper>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
            {Array.from({ length: numPos }).map((_, idx) => (
              <Paper key={idx} elevation={3} sx={{
                flex: '1 1 320px',
                minWidth: 280,
                maxWidth: 400,
                p: 2,
                mb: 2,
                background: 'linear-gradient(120deg, #e3f2fd 0%, #bbdefb 100%)',
                border: '1.5px solid #90caf9',
                borderRadius: 4,
                boxShadow: '0 8px 32px rgba(25, 118, 210, 0.13)',
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5
              }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                  <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>Posicionamento {idx + 1}</Typography>
                  {Array.isArray(selecionados) && selecionados.includes(idx) && (
                    <Typography variant="caption" color="primary" sx={{ fontWeight: 'bold', backgroundColor: '#e3f2fd', padding: '2px 6px', borderRadius: '4px' }}>
                      ✓ SELECIONADO
                    </Typography>
                  )}
                  {cronos[idx]?.puxadaAtivo && (
                    <Typography variant="caption" className="aviso-posicionamento" sx={{ fontWeight: 'bold', display: 'inline-block', ml: 1 }}>
                      PUXANDO
                    </Typography>
                  )}
                  {cronos[idx]?.descargaAtivo && (
                    <Typography variant="caption" className="aviso-descarga" sx={{ fontWeight: 'bold', display: 'inline-block', ml: 1 }}>
                      DESCARREGANDO
                    </Typography>
                  )}
                  {cronos[idx]?.puxadaTempo > 0 && cronos[idx]?.descargaTempo > 0 && (
                    <Typography variant="caption" color="success" sx={{ fontWeight: 'bold' }}>
                      ✓ CONCLUÍDO
                    </Typography>
                  )}
                </Stack>
                <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                  <Typography variant="body1" color="primary" sx={{ letterSpacing: 1, minWidth: 80 }}>
                    Vagões:
                  </Typography>
                  <MuiTextField
                    type="number"
                    size="small"
                    value={vagoesPorPos[idx] || ''}
                    onChange={e => handleVagoesChange(idx, Number(e.target.value))}
                    inputProps={{ min: 1, max: qtdVagoes }}
                    sx={{ width: 60 }}
                  />
                  <Checkbox
                    checked={Array.isArray(selecionados) && selecionados.includes(idx)}
                    onChange={() => handleSelecionar(idx)}
                    color="primary"
                    disabled={!Array.isArray(cronos) || !cronos[idx] || cronos[idx].descargaTempo === 0}
                    title={!Array.isArray(cronos) || !cronos[idx] || cronos[idx].descargaTempo === 0 ? "Complete a descarga para selecionar" : "Selecionar posicionamento"}
                  />
                </Stack>
                <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                  <Cronometro
                    ativo={Array.isArray(cronos) && cronos[idx] ? cronos[idx].puxadaAtivo : false}
                    onFinalizar={tempo => finalizarPuxada(idx, tempo)}
                    label="Puxada"
                    tempoInicial={Array.isArray(cronos) && cronos[idx] ? cronos[idx].puxadaTempo : 0}
                    tempoLimite={20000}
                    onExcedeuLimite={() => onExcedeuPuxada(idx)}
                  />
                  <MuiButton
                    onClick={() => iniciarPuxada(idx)}
                    size="small"
                    disabled={!Array.isArray(cronos) || !cronos[idx] || cronos[idx].puxadaAtivo || !podeIniciarPuxada(idx)}
                    sx={{ mt: 1 }}
                    color={podeIniciarPuxada(idx) ? "primary" : "inherit"}
                    variant={podeIniciarPuxada(idx) ? "contained" : "outlined"}
                  >
                    {!Array.isArray(cronos) || !cronos[idx] ? "Aguardando..." : cronos[idx].puxadaAtivo ? "⏱️ Puxada em andamento" : podeIniciarPuxada(idx) ? "🚂 Iniciar Puxada" : "⏳ Aguardando etapa anterior"}
                  </MuiButton>
                </Stack>
                <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                  <Cronometro
                    ativo={Array.isArray(cronos) && cronos[idx] ? cronos[idx].descargaAtivo : false}
                    onFinalizar={tempo => finalizarDescarga(idx, tempo)}
                    label="Descarga"
                    tempoInicial={Array.isArray(cronos) && cronos[idx] ? cronos[idx].descargaTempo : 0}
                    tempoLimite={60000}
                    onExcedeuLimite={() => onExcedeuDescarga(idx)}
                  />
                  <MuiButton
                    onClick={() => iniciarDescarga(idx)}
                    size="small"
                    disabled={!Array.isArray(cronos) || !cronos[idx] || cronos[idx].descargaAtivo || !podeIniciarDescarga(idx)}
                    sx={{ mt: 1 }}
                    color={podeIniciarDescarga(idx) ? "success" : "inherit"}
                    variant={podeIniciarDescarga(idx) ? "contained" : "outlined"}
                  >
                    {!Array.isArray(cronos) || !cronos[idx] ? "Aguardando..." : cronos[idx].descargaAtivo ? "⏱️ Descarga em andamento" : podeIniciarDescarga(idx) ? "📦 Iniciar Descarga" : "⏳ Aguardando puxada"}
                  </MuiButton>
                </Stack>
                {/* Motivos de impacto */}
                {Array.isArray(cronos) && cronos[idx] && cronos[idx].puxadaExcedeu && (
                  <Stack spacing={1} mb={1}>
                    <Typography variant="caption" color="error">
                      Impacto: {msParaMinutosSegundos(cronos[idx].tempoImpactoPuxada || 0)}
                    </Typography>
                    <MuiTextField
                      size="small"
                      label="Motivo Impacto Puxada"
                      value={cronos[idx].motivoImpactoPuxada || ''}
                      onChange={e => handleMotivoChange(idx, 'motivoImpactoPuxada', e.target.value)}
                      placeholder="Ex: Problema mecânico, Falha operacional..."
                    />
                  </Stack>
                )}
                {Array.isArray(cronos) && cronos[idx] && cronos[idx].descargaExcedeu && (
                  <Stack spacing={1} mb={1}>
                    <Typography variant="caption" color="error">
                      Impacto: {msParaMinutosSegundos(cronos[idx].tempoImpactoDescarga || 0)}
                    </Typography>
                    <MuiTextField
                      size="small"
                      label="Motivo Impacto Descarga"
                      value={cronos[idx].motivoImpactoDescarga || ''}
                      onChange={e => handleMotivoChange(idx, 'motivoImpactoDescarga', e.target.value)}
                      placeholder="Ex: Bloqueio no sistema, Falha na descarga..."
                    />
                    <MuiTextField
                      size="small"
                      label="Motivo Adicional (opcional)"
                      value={cronos[idx].motivoImpactoDescargaAdicional || ''}
                      onChange={e => handleMotivoChange(idx, 'motivoImpactoDescargaAdicional', e.target.value)}
                      placeholder="Segundo motivo se necessário..."
                    />
                  </Stack>
                )}
                {cronos[idx]?.descargaAtivo && (
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <MuiButton variant="contained" className="btn-troca-turno" size="small" onClick={() => iniciarTrocaDeTurno(idx)}>
                      Troca de Turno
                    </MuiButton>
                    <MuiButton variant="contained" color="success" size="small" onClick={() => finalizarTrocaDeTurno(idx)}>
                      Retornar com a Descarga
                    </MuiButton>
                  </Stack>
                )}
                {cronos[idx]?.puxadaAtivo && !cronos[idx]?.descargaAtivo && (
                  <div className="aviso-posicionamento">
                    Posicionando: Aguarde o operador finalizar a puxada para liberar a descarga.
                  </div>
                )}
                {cronos[idx]?.descargaAtivo && (
                  <div className="aviso-descarga">
                    Descarga em andamento: Aguarde o operador finalizar a descarga para avançar.
                  </div>
                )}
              </Paper>
            ))}
          </Stack>
        </>
      )}
      {Array.isArray(selecionados) && selecionados.length > 0 && (
        <Paper sx={{ mt: 2, p: 2, background: '#e3f2fd' }}>
          <Typography variant="subtitle1" gutterBottom>
            📋 Resumo dos Posicionamentos Selecionados
            <span style={{ color: '#1976d2', fontWeight: 'bold', marginLeft: '8px' }}>
              ({Array.isArray(selecionados) ? selecionados.length : 0} de {numPos})
            </span>
          </Typography>
          <Typography>Qtd Vagões (selecionados): <b>{Array.isArray(selecionados) ? selecionados.reduce((acc, idx) => acc + (vagoesPorPos[idx] || 0), 0) : 0}</b></Typography>
          <Typography>Tempos de Descarga:</Typography>
          <ul>
            {Array.isArray(cronos) && Array.isArray(selecionados) ? selecionados.map(idx => {
              const crono = cronos[idx];
              if (!crono) return null;
              return (
                <li key={idx}>
                  Posicionamento {idx + 1}: {msParaMinutosSegundos(crono.descargaTempo || 0)}
                  {crono.descargaExcedeu && crono.tempoImpactoDescarga > 0 && (
                    <span style={{ color: 'red' }}> (Impacto: {msParaMinutosSegundos(crono.tempoImpactoDescarga)} - {crono.motivoImpactoDescarga || ''}{crono.motivoImpactoDescargaAdicional ? ` / ${crono.motivoImpactoDescargaAdicional}` : ''})</span>
                  )}
                </li>
              );
            }) : null}
          </ul>
          <MuiButton variant="contained" color="success" sx={{ mt: 1, mr: 1 }} onClick={compartilharSelecionadosWhatsApp}>
            Enviar selecionados via WhatsApp
          </MuiButton>
          <MuiButton
            variant="contained"
            color="info"
            sx={{ mt: 1 }}
            onClick={() => {
              // Função para exportar Relatório H/H dos selecionados
              try {
                if (!Array.isArray(selecionados) || selecionados.length === 0) {
                  setFeedback({ type: 'info', message: 'Nenhum posicionamento selecionado para exportar.' });
                  return;
                }
                const doc = new jsPDF();
                const dataHora = new Date().toLocaleString();
                doc.setFontSize(16);
                doc.text('Relatório H/H', 14, 15);
                doc.setFontSize(11);
                doc.text(`Moega: ${moega}`, 14, 25);
                doc.text(`Produto: ${produto}`, 14, 32);
                doc.text(`Armazém: ${armazem}`, 14, 39);
                doc.text(`Maquinista: ${maquinista}`, 14, 46);
                doc.text(`Operador: ${operador}`, 14, 53);
                doc.text(`Qtd Vagões (selecionados): ${Array.isArray(selecionados) ? selecionados.reduce((acc, idx) => acc + (vagoesPorPos[idx] || 0), 0) : 0}`, 14, 60);
                doc.text(`Horário de Início: ${inicio}`, 14, 67);
                doc.text(`Data/Hora do relatório: ${dataHora}`, 14, 74);
                // Monta tabela
                const tableData = Array.isArray(cronos) && Array.isArray(selecionados) ? selecionados.map(idx => {
                  const crono = cronos[idx];
                  if (!crono) return null;
                  return [
                    idx + 1,
                    vagoesPorPos[idx] || 0,
                    msParaMinutosSegundos(crono.puxadaTempo || 0),
                    crono.puxadaExcedeu && crono.tempoImpactoPuxada > 0 ? `${msParaMinutosSegundos(crono.tempoImpactoPuxada)} ${crono.motivoImpactoPuxada || ''}` : '-',
                    msParaMinutosSegundos(crono.descargaTempo || 0),
                    crono.descargaExcedeu && crono.tempoImpactoDescarga > 0 ? `${msParaMinutosSegundos(crono.tempoImpactoDescarga)} ${crono.motivoImpactoDescarga || ''}${crono.motivoImpactoDescargaAdicional ? ` / ${crono.motivoImpactoDescargaAdicional}` : ''}` : '-',
                    Array.isArray(crono.trocasDeTurno) && crono.trocasDeTurno.length > 0
                      ? crono.trocasDeTurno.map(t => `${t.inicio}${t.fim ? ` até ${t.fim} (${Math.round((t.duracaoMs || 0) / 60000)} min)` : ' (em andamento...)'}`).join('; ')
                      : '-'
                  ];
                }).filter(Boolean) : [];
                autoTable(doc, {
                  head: [['Pos', 'Vagões', 'Puxada', 'Impacto Puxada', 'Descarga', 'Impacto Descarga', 'Trocas de Turno', 'Status']],
                  body: tableData,
                  startY: 82,
                  styles: { fontSize: 11, cellPadding: 2 },
                  headStyles: { fillColor: [41, 128, 185], textColor: 255 },
                  alternateRowStyles: { fillColor: [240, 240, 240] },
                });
                doc.save(`Relatorio_HH_${moega}_${new Date().toISOString().slice(0, 10)}.pdf`);
                setFeedback({ type: 'success', message: 'Relatório H/H exportado com sucesso!' });
              } catch (e) {
                setFeedback({ type: 'error', message: 'Erro ao exportar PDF: ' + e.message });
              }
            }}
          >
            Exportar Relatório H/H (PDF)
          </MuiButton>
          <MuiButton
            variant="outlined"
            color="secondary"
            sx={{ mt: 1, ml: 1 }}
            onClick={() => {
              const concluidos = Array.isArray(cronos) ? cronos.map((crono, idx) =>
                crono && crono.descargaTempo > 0 ? idx : null
              ).filter(idx => idx !== null) : [];
              setSelecionados(concluidos);
              if (process.env.NODE_ENV === 'development') {
                console.log('✅ Selecionados todos os posicionamentos concluídos:', concluidos);
              }
            }}
          >
            Selecionar Todos Concluídos
          </MuiButton>
          <MuiButton
            variant="outlined"
            color="error"
            sx={{ mt: 1, ml: 1 }}
            onClick={() => {
              setSelecionados([]);
              if (process.env.NODE_ENV === 'development') {
                console.log('🧹 Seleção limpa');
              }
            }}
          >
            Limpar Seleção
          </MuiButton>
        </Paper>
      )}
      {mostrarResumo && (
        <Paper sx={{ mt: 3, p: 3, background: '#ffffff', border: '2px solid #1976d2' }} id={`resumo-descarga-${moega}`}>
          {/* Cabeçalho do Relatório */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3, pb: 2, borderBottom: '2px solid #1976d2' }}>
            <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
              📋 RELATÓRIO FINAL DE DESCARGA
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              {salvando && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={16} />
                  <Typography variant="caption" color="primary">
                    Salvando...
                  </Typography>
                </Stack>
              )}
              <Typography variant="caption" color="text.secondary">
                Gerado em: {new Date().toLocaleString()}
              </Typography>
            </Stack>
          </Stack>

          {/* Informações Principais */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Paper elevation={1} sx={{ p: 2, background: '#f8f9fa' }}>
                <Typography variant="h6" color="primary" gutterBottom>📊 DADOS OPERACIONAIS</Typography>
                <Stack spacing={1}>
                  <Typography><strong>Moega:</strong> {moega}</Typography>
                  <Typography><strong>Produto:</strong> {produto}</Typography>
                  <Typography><strong>Armazém:</strong> {armazem}</Typography>
                  <Typography><strong>Maquinista:</strong> {maquinista}</Typography>
                  <Typography><strong>Quantidade de Vagões:</strong> {qtdVagoes}</Typography>
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper elevation={1} sx={{ p: 2, background: '#f8f9fa' }}>
                <Typography variant="h6" color="primary" gutterBottom>⏰ CRONOGRAMA</Typography>
                <Stack spacing={1}>
                  <Typography><strong>Início:</strong> {inicio}</Typography>
                  <Typography><strong>Fim:</strong> {calcularHorarioFim()}</Typography>
                  <Typography><strong>Tempo Total:</strong> {calcularTempoTotal()}</Typography>
                  <Typography><strong>Tempo Total Puxada:</strong> {calcularTempoTotalPuxada()}</Typography>
                  <Typography><strong>TMD (Tempo Médio Descarga):</strong> {calcularTMD()}</Typography>
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          {/* Estatísticas de Impacto */}
          <Paper elevation={1} sx={{ p: 2, mb: 3, background: '#fff3e0' }}>
            <Typography variant="h6" color="warning.main" gutterBottom>⚠️ ESTATÍSTICAS DE IMPACTO</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography><strong>Impactos na Puxada:</strong> {calcularImpactosTotais().puxada}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography><strong>Impactos na Descarga:</strong> {calcularImpactosTotais().descarga}</Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Detalhamento por Posicionamento */}
          <Paper elevation={1} sx={{ p: 2, mb: 3, background: '#f8f9fa' }}>
            <Typography variant="h6" color="primary" gutterBottom>📋 DETALHAMENTO POR POSICIONAMENTO</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Pos.</strong></TableCell>
                    <TableCell><strong>Vagões</strong></TableCell>
                    <TableCell><strong>Tempo Puxada</strong></TableCell>
                    <TableCell><strong>Tempo Descarga</strong></TableCell>
                    <TableCell><strong>Impactos</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Array.isArray(cronos) ? cronos.map((c, i) => {
                    // Verificação de segurança para evitar erros quando c é undefined
                    if (!c) return null;

                    return (
                      <TableRow key={i}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell>{vagoesPorPos[i] || 0}</TableCell>
                        <TableCell>
                          {msParaMinutosSegundos(c.puxadaTempo || 0)}
                          {c.puxadaExcedeu && c.tempoImpactoPuxada > 0 && (
                            <Typography variant="caption" color="error" display="block">
                              +{msParaMinutosSegundos(c.tempoImpactoPuxada)}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {msParaMinutosSegundos(c.descargaTempo || 0)}
                          {c.descargaExcedeu && c.tempoImpactoDescarga > 0 && (
                            <Typography variant="caption" color="error" display="block">
                              +{msParaMinutosSegundos(c.tempoImpactoDescarga)}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {c.puxadaExcedeu && c.tempoImpactoPuxada > 0 && (
                            <Typography variant="caption" color="error" display="block">
                              Puxada: {c.motivoImpactoPuxada || 'Sem motivo'}
                            </Typography>
                          )}
                          {c.descargaExcedeu && c.tempoImpactoDescarga > 0 && (
                            <Typography variant="caption" color="error" display="block">
                              Descarga: {c.motivoImpactoDescarga || 'Sem motivo'}
                              {c.motivoImpactoDescargaAdicional && ` / ${c.motivoImpactoDescargaAdicional}`}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {(c.puxadaTempo || 0) > 0 && (c.descargaTempo || 0) > 0 ? (
                            <Typography variant="caption" color="success" sx={{ fontWeight: 'bold' }}>
                              ✓ CONCLUÍDO
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="warning.main">
                              ⏳ EM ANDAMENTO
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  }) : null}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Botões de Ação */}
          <Stack direction="row" spacing={2} justifyContent="center">
            <MuiTooltip title="Exportar relatório em PDF">
              <MuiButton
                variant="contained"
                color="primary"
                onClick={exportarResumoPDF}
                startIcon={<span>📄</span>}
                aria-label="Exportar relatório em PDF"
              >
                Exportar PDF
              </MuiButton>
            </MuiTooltip>
            <MuiTooltip title="Compartilhar resumo via WhatsApp">
              <MuiButton
                variant="contained"
                color="success"
                onClick={compartilharWhatsApp}
                startIcon={<span>📱</span>}
                aria-label="Compartilhar via WhatsApp"
              >
                Enviar via WhatsApp
              </MuiButton>
            </MuiTooltip>
            <MuiTooltip title="Nova Composição">
              <MuiButton
                variant="contained"
                color="warning"
                size="large"
                onClick={resetarSistema}
                startIcon={<span>🔄</span>}
                aria-label="Nova Composição"
              >
                Nova Composição
              </MuiButton>
            </MuiTooltip>
          </Stack>
        </Paper>
      )}
    </Paper>
  );
}

// Adicione ao final do arquivo:
export default function ControleMoega() {
  const [moegaSelecionada, setMoegaSelecionada] = useState('Moega 01');
  const [moega1, setMoega1] = useState({
    produto: '',
    qtdVagoes: 0,
    posicionamentos: [],
    armazem: '',
    inicio: '',
    maquinista: '',
    operador: '',
    cronos: [],
    confirmado: false,
    mostrarResumo: false,
    selecionados: [],
    vagoesPorPos: [],
    salvando: false
  });
  const [moega2, setMoega2] = useState({
    produto: '',
    qtdVagoes: 0,
    posicionamentos: [],
    armazem: '',
    inicio: '',
    maquinista: '',
    operador: '',
    cronos: [],
    confirmado: false,
    mostrarResumo: false,
    selecionados: [],
    vagoesPorPos: [],
    salvando: false
  });

  const moegaAtual = moegaSelecionada === 'Moega 01' ? moega1 : moega2;
  const setMoegaAtual = moegaSelecionada === 'Moega 01' ? setMoega1 : setMoega2;

  // Estados já existentes
  const [filtroData, setFiltroData] = useState("");
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [carregandoRegistros, setCarregandoRegistros] = useState(false);
  const [carregandoMaisComps, setCarregandoMaisComps] = useState(false);
  const [registros, setRegistros] = useState([]);
  const [mostrarComposicoesEmAndamento, setMostrarComposicoesEmAndamento] = useState(false);
  const [composicoesEmAndamento, setComposicoesEmAndamento] = useState([]);
  // Função auxiliar para converter tempo para minutos decimais
  const tempoParaMinutoDecimal = (tempo) => {
    if (!tempo || !tempo.includes(":")) return 0;
    const [min, sec] = tempo.split(":").map(Number);
    return min + sec / 60;
  };
  // Dados para o gráfico
  const dadosGrafico = registros.map(r => ({
    data: r.data,
    puxada: tempoParaMinutoDecimal(r.tempoPuxada),
    descarga: tempoParaMinutoDecimal(r.tempoDescarga),
    impacto: tempoParaMinutoDecimal(r.tempoImpacto),
  }));

  // Funções de controle do modal (exemplo)
  const abrirModalComposicoes = () => setMostrarComposicoesEmAndamento(true);
  const fecharModalComposicoes = () => setMostrarComposicoesEmAndamento(false);

  // Função para carregar registros
  const carregarRegistros = async () => {
    setCarregandoRegistros(true);
    try {
      // Exemplo de consulta ao Firestore (adapte conforme necessário)
      const registrosCollection = collection(db, "registros");
      let qArr = [];
      if (filtroData) {
        qArr.push(where('data', '==', filtroData));
      }
      qArr.push(orderBy('data', 'desc'));
      qArr.push(limit(50));
      const q = query(registrosCollection, ...qArr);
      const snapshot = await getDocs(q);
      let lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRegistros(lista);
    } catch (e) {
      setFeedback({ type: "error", message: `Erro ao carregar registros: ${e.message}` });
    } finally {
      setCarregandoRegistros(false);
    }
  };

  // Função para carregar composições em andamento
  const carregarComposicoesEmAndamento = async () => {
    try {
      const composicoesCollection = collection(db, "composicoes_em_andamento");
      const q = query(composicoesCollection, limit(50));
      const snapshot = await getDocs(q);
      const todasComposicoes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComposicoesEmAndamento(todasComposicoes);
      setMostrarComposicoesEmAndamento(true);
    } catch (e) {
      setFeedback({ type: "error", message: `Erro ao carregar composições: ${e.message}` });
    }
  };

  // Função para carregar uma composição em andamento selecionada
  const handleCarregarComposicaoEmAndamento = (comp) => {
    if (!comp || !comp.moega) return;
    if (comp.moega === 'Moega 01') {
      setMoega1({
        ...moega1,
        ...comp,
        confirmado: false, // Permite edição/continuação
        mostrarResumo: false,
        salvando: false
      });
      setMoegaSelecionada('Moega 01');
    } else if (comp.moega === 'Moega 02') {
      setMoega2({
        ...moega2,
        ...comp,
        confirmado: false,
        mostrarResumo: false,
        salvando: false
      });
      setMoegaSelecionada('Moega 02');
    }
    setMostrarComposicoesEmAndamento(false);
    setFeedback({ type: 'success', message: 'Composição carregada para edição!' });
  };

  return (
    <div className="p-6 space-y-6">
      <img src="/logo-vli.png" alt="Logo VLI" style={{ display: 'block', margin: '32px auto 8px auto', maxWidth: 180, width: '100%', height: 'auto' }} />
      <h2 style={{ textAlign: 'center', width: '100%' }}>Sistema Inteligente de Descarga VLI</h2>
      {/* Menu estilizado para seleção de moega */}
      <Paper elevation={3} sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2,
        mb: 3,
        borderRadius: 3,
        background: 'linear-gradient(90deg, #e3f2fd 0%, #bbdefb 100%)',
        backdropFilter: 'blur(12px) saturate(1.2)',
        border: '1.5px solid #90caf9',
        flexWrap: { xs: 'wrap', sm: 'nowrap' }
      }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
          <ul className="acorh" style={{ width: 200, margin: 0 }}>
            <li>
              <a href="#" style={{ cursor: 'pointer' }}>{moegaSelecionada}</a>
              <ul>
                <li><a href="#" onClick={e => { e.preventDefault(); setMoegaSelecionada('Moega 01'); }}>Moega 01</a></li>
                <li><a href="#" onClick={e => { e.preventDefault(); setMoegaSelecionada('Moega 02'); }}>Moega 02</a></li>
              </ul>
            </li>
          </ul>
          <MuiTextField
            type="date"
            size="small"
            value={filtroData}
            onChange={e => setFiltroData(e.target.value)}
            label="Filtrar por data"
            InputLabelProps={{ shrink: true }}
          />
          <MuiButton
            variant="contained"
            color="primary"
            onClick={carregarComposicoesEmAndamento}
          >
            🔄 Composições em Andamento
          </MuiButton>
        </Stack>
      </Paper>


      {/* Painel principal do MoegaCard */}
      <MoegaCard
        moega={moegaSelecionada}
        dados={moegaAtual}
        setDados={setMoegaAtual}
        setFeedback={setFeedback}
      />
      {/* Gráficos e tabelas de desempenho restaurados */}
      {/* Página inicial personalizada com valores VLI */}
      <Paper elevation={3} sx={{
        mt: 2,
        mb: 3,
        p: 4,
        borderRadius: 4,
        background: 'linear-gradient(90deg, #e3f2fd 0%, #bbdefb 100%)',
        backdropFilter: 'blur(12px) saturate(1.2)',
        border: '1.5px solid #90caf9',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: 'stretch',
        gap: 4,
        minHeight: 260
      }}>
        <div style={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ marginTop: 0 }}>Nossos Valores</h3>
          <ul style={{ fontSize: '1.15rem', color: '#1976d2', lineHeight: 1.7, margin: 0, paddingLeft: 24 }}>
            <li style={{ marginBottom: 16 }}><b>Segurança</b> em primeiro lugar</li>
            <li style={{ marginBottom: 16 }}><b>Ética</b> e transparência em todas as ações</li>
            <li style={{ marginBottom: 16 }}><b>Inovação</b> para eficiência e sustentabilidade</li>
            <li style={{ marginBottom: 16 }}><b>Foco no cliente</b> e excelência operacional</li>
            <li style={{ marginBottom: 16 }}><b>Respeito às pessoas</b> e ao meio ambiente</li>
          </ul>
          <div style={{ marginTop: 18, color: '#1565c0', fontWeight: 500, fontSize: '1.1rem' }}>
            <span>Bem-vindo ao Sistema Inteligente de Descarga VLI!</span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 18 }}>
          <img src="/img vli/terminalTiplam.jpg" alt="Terminal Tiplam" className="valores-img" style={{ width: 180, height: 120, objectFit: 'cover', borderRadius: 18, boxShadow: '0 4px 24px #90caf9' }} />
          <img src="/img vli/composiçao.jpg" alt="Composição" className="valores-img" style={{ width: 180, height: 120, objectFit: 'cover', borderRadius: 18, boxShadow: '0 4px 24px #90caf9' }} />
          <img src="/img vli/inovar.jpg" alt="Inovar" className="valores-img" style={{ width: 180, height: 120, objectFit: 'cover', borderRadius: 18, boxShadow: '0 4px 24px #90caf9' }} />
        </div>
      </Paper>
      {/* Feedback visual restaurado */}
      <Feedback {...feedback} onClose={() => setFeedback({ type: '', message: '' })} />
      {/* Modal de composições em andamento restaurado */}
      {mostrarComposicoesEmAndamento && (
        <ComposicoesEmAndamento
          composicoes={composicoesEmAndamento}
          onCarregar={handleCarregarComposicaoEmAndamento}
          onFechar={fecharModalComposicoes}
        />
      )}
      {/* (As próximas etapas restaurarão outros modais se necessário) */}
      {/* Rodapé institucional */}
      <footer style={{
        width: '100%',
        textAlign: 'center',
        padding: '18px 0 10px 0',
        background: 'linear-gradient(90deg, #e3f2fd 0%, #bbdefb 100%)',
        color: '#1976d2',
        fontWeight: 500,
        fontSize: '1.05rem',
        letterSpacing: '0.01em',
        marginTop: 32,
        borderTop: '2px solid #90caf9'
      }}>
        <img src="/logo-vli.png" alt="Logo VLI" style={{ height: 32, verticalAlign: 'middle', marginRight: 8 }} />
        Sistema Inteligente de Descarga VLI &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}

// Função utilitária para gerar o idUnico de composições em andamento
function gerarIdUnicoComposicao(moega, data, inicio) {
  return `${moega || 'Moega'}_${data}_${inicio || 'semInicio'}`.replace(/\W+/g, '_');
}
