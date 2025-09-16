import { QueryInterface, DataTypes } from "sequelize";
// Adicionar a coluna flowBuilderId na tabela Whatsapp

module.exports = {

  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Tickets", "maxUseInactiveTime", {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
  },

  down: (queryInterface: QueryInterface) => {
    queryInterface.removeColumn("Tickets", "maxUseInactiveTime");
  }

}
