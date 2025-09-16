import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.addColumn("QuickMessages", "isOficial", {
        type: DataTypes.BOOLEAN,
        defaultValue: false, // Assuming default value as false, you can change it if needed
      }),
      queryInterface.addColumn("QuickMessages", "language", {
        type: DataTypes.STRING,
        allowNull: true,
      }),
      queryInterface.addColumn("QuickMessages", "status", {
        type: DataTypes.STRING,
        allowNull: true,
      }),
      queryInterface.addColumn("QuickMessages", "category", {
        type: DataTypes.STRING,
        allowNull: true,
      }),
      queryInterface.addColumn("QuickMessages", "metaID", {
        type: DataTypes.STRING,
        allowNull: true,
      }),
    ]);
  },

  down: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.removeColumn("QuickMessages", "isOficial"),
      queryInterface.removeColumn("QuickMessages", "language"),
      queryInterface.removeColumn("QuickMessages", "status"),
      queryInterface.removeColumn("QuickMessages", "category"),
      queryInterface.removeColumn("QuickMessages", "metaID"),
    ]);
  }
};
