'use strict'
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('multiples_matches', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      multiple_id:{
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'multiples',
        },
      },
      match_id:{
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'matches',
        },
      },
      score:Sequelize.JSON,
      home_odd:{
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      draw_odd:{
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      away_odd:{
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      preview:{
        type: Sequelize.STRING,
        allowNull: false,
      },
      result:{
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      startAt:{
        type: Sequelize.DATE,
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
    await queryInterface.dropTable('multiples_matches')
  }
}