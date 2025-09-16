import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Users", "showFlow", {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "enabled"
    })
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Users", "showFlow");
  }
};
