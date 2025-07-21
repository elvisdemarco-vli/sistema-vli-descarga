import React, { useEffect, useRef, useState } from 'react';
import { Button, Stack, Typography } from '@mui/material';

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export default function Cronometro({ ativo, onFinalizar, label, tempoInicial = 0, tempoLimite, onExcedeuLimite }) {
  const [tempo, setTempo] = useState(tempoInicial);
  const intervalRef = useRef(null);
  const [excedeu, setExcedeu] = useState(false);

  // Atualiza o tempo se tempoInicial mudar (ex: novo ciclo)
  useEffect(() => {
    setTempo(tempoInicial);
  }, [tempoInicial]);

  // Efeito para controlar o cronômetro
  useEffect(() => {
    if (ativo) {
      intervalRef.current = setInterval(() => {
        setTempo(prevTempo => prevTempo + 1000);
      }, 1000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [ativo]);

  // Efeito para verificar limite de tempo
  useEffect(() => {
    if (tempoLimite && tempo >= tempoLimite && !excedeu) {
      setExcedeu(true);
      if (onExcedeuLimite) onExcedeuLimite();
    }
  }, [tempo, tempoLimite, excedeu, onExcedeuLimite]);

  const handleFinalizar = () => {
    if (onFinalizar) onFinalizar(tempo);
  };

  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Typography variant="subtitle1">{label}:</Typography>
      <Typography variant="h6" color={excedeu ? 'error' : 'inherit'}>
        {formatTime(tempo)}
      </Typography>
      {ativo && (
        <Button 
          variant="contained" 
          color={excedeu ? 'error' : 'success'} 
          onClick={handleFinalizar}
        >
          Finalizar
        </Button>
      )}
      {excedeu && <Typography color="error">Tempo excedido!</Typography>}
    </Stack>
  );
} 