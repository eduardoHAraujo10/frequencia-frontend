import api from './api';

/**
 * Serviço para gerenciar registros de ponto
 */
export default {
  /**
   * Obtém todos os registros de ponto
   * @returns {Promise} Promise com os dados dos registros
   */
  listarTodos() {
    return api.get('/registros');
  },

  /**
   * Adiciona um novo registro de ponto
   * @param {Object} registro - Dados do registro a ser adicionado
   * @returns {Promise} Promise com o resultado da operação
   */
  adicionar(registro) {
    return api.post('/registros', registro);
  },

  /**
   * Edita um registro de ponto existente
   * @param {Number} id - ID do registro a ser editado
   * @param {Object} registro - Novos dados do registro
   * @returns {Promise} Promise com o resultado da operação
   */
  editar(id, registro) {
    return api.put(`/registros/${id}`, registro);
  },

  /**
   * Obtém a lista de alunos
   * @returns {Promise} Promise com os dados dos alunos
   */
  listarAlunos() {
    return api.get('/alunos');
  }
}; 