import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { movimento } from '../../../shared/tokens';

// Respeita a opção "Reduzir movimento" do sistema (iOS e Android).
export function useMovimentoReduzido() {
  const [reduzido, setReduzido] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduzido);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduzido);
    return () => sub?.remove?.();
  }, []);
  return reduzido;
}

// Durações já ajustadas: com movimento reduzido, tudo vira 0 (troca instantânea).
export function useDuracoes() {
  const reduzido = useMovimentoReduzido();
  return {
    reduzido,
    rapido: reduzido ? 0 : movimento.rapido,
    medio: reduzido ? 0 : movimento.medio,
    lento: reduzido ? 0 : movimento.lento,
  };
}
