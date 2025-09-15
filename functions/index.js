// Importa e reexporta as funções dos módulos específicos.

const callableFunctions = require("./src/callable");
const scheduledFunctions = require("./src/scheduled");
const triggerFunctions = require("./src/triggers");

// Exporta todas as funções para o Firebase para que possam ser implantadas.
module.exports = {
  ...callableFunctions,
  ...scheduledFunctions,
  ...triggerFunctions,
};
