import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.changeColumn("QuickMessageComponents", "example", {
      type: DataTypes.STRING(2048),
      allowNull: true
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.changeColumn("QuickMessageComponents", "example", {
      type: DataTypes.STRING(255),
      allowNull: true
    });
  }
};
