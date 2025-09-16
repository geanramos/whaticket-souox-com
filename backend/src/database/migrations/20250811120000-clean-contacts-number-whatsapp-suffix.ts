import { QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // Remove sufixos "@s.whatsapp.net" e "@g.us" do campo number em Contacts
    await queryInterface.sequelize.query(`
      UPDATE "Contacts"
      SET "number" = split_part("number", '@', 1)
      WHERE "number" LIKE '%@s.whatsapp.net' OR "number" LIKE '%@g.us';
    `);
  },

  down: async () => {
    // Migração irreversível: não é possível restaurar os sufixos removidos
    return Promise.resolve();
  }
};


