import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.addColumn("QuickMessages", "whatsappId", {
        type: DataTypes.INTEGER,
        references: {
          model: "Whatsapps", // Assumes the table name for QuickMessage is "QuickMessages"
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      })
    ]);
  },

  down: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.removeColumn("QuickMessages", "whatsappId")
    ]);
  }
};
