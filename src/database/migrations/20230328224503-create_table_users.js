'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      first_name: Sequelize.STRING,
      last_name: Sequelize.STRING,
      user_name: Sequelize.STRING,
      active:{
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      admin:{
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      chat_id: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
    })
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('sports')
  }
};
