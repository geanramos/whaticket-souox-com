import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Users", "showCampaign", {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "disabled"
    })
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Users", "showCampaign");
  }
};
