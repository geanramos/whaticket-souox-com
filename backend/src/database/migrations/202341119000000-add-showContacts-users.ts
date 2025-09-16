import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Users", "showContacts", {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "enabled"
    })
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Users", "showContacts");
  }
};
