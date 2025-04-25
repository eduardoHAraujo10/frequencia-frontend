/**
 * Formata uma hora para o formato HH:mm considerando o timezone
 * @param {string} timeString - String de data/hora (ISO ou HH:mm)
 * @returns {string} Hora formatada no padrão HH:mm
 */
export function formatTime(timeString) {
  if (!timeString) return '';
  
  try {
    // Se for uma string ISO completa (como 2025-04-25T07:00:00.000000Z)
    if (timeString.includes('T')) {
      // Criar data considerando que a string está em UTC
      const date = new Date(timeString);
      if (!isNaN(date.getTime())) {
        // Ajustar para o timezone local
        const localDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
        return localDate.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      }
    }
    
    // Se já estiver no formato HH:MM ou HH:MM:SS
    if (typeof timeString === 'string' && timeString.match(/^\d{2}:\d{2}(:\d{2})?$/)) {
      return timeString.substring(0, 5);
    }
    
    // Tenta extrair horas e minutos da string
    const [hours, minutes] = timeString.split(':');
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  } catch (error) {
    console.error('Erro ao formatar hora:', error);
    return timeString;
  }
}

/**
 * Formata uma data para o formato dd/mm/yyyy
 * @param {string} dateString - String de data
 * @returns {string} Data formatada
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    return date.toLocaleDateString('pt-BR');
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return dateString;
  }
}

/**
 * Formata uma data e hora para o formato dd/mm/yyyy HH:mm
 * @param {string} dateTimeString - String de data e hora
 * @returns {string} Data e hora formatada
 */
export function formatDateTime(dateTimeString) {
  if (!dateTimeString) return '';
  
  try {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return '';
    
    // Ajustar para o timezone local
    const localDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
    
    const dia = String(localDate.getDate()).padStart(2, '0');
    const mes = String(localDate.getMonth() + 1).padStart(2, '0');
    const ano = localDate.getFullYear();
    const hora = String(localDate.getHours()).padStart(2, '0');
    const minutos = String(localDate.getMinutes()).padStart(2, '0');
    
    return `${dia}/${mes}/${ano} ${hora}:${minutos}`;
  } catch (error) {
    console.error('Erro ao formatar data e hora:', error);
    return dateTimeString;
  }
}

/**
 * Formata uma data completa com dia da semana e mês por extenso
 * @param {string} dateString - String de data
 * @returns {string} Data formatada por extenso
 */
export function formatFullDate(dateString) {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Erro ao formatar data completa:', error);
    return dateString;
  }
} 