'use client';

import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Atualiza o valor debounced após o delay especificado
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpa o timeout se o valor mudar (ou seja, o usuário continua digitando)
    // Isso evita que o valor antigo seja setado se um novo valor chegar antes do fim do delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Só re-executa o efeito se o valor ou o delay mudarem

  return debouncedValue;
}
