'use strict'
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('multiples', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_profile_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users_profiles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      matches_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      multiple_odd: {
        type: Sequelize.DOUBLE,
        defaultValue: 1
      },
      green: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      red: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      running: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      status:{
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'multiple_created',
      },
      cashout:{
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      startAt:{
        type: Sequelize.DATE,
        allowNull: false
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
    await queryInterface.dropTable('multiples')
  }
}