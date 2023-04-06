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
      notification_status:{
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
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
    })
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('multiples_matches')
  }
}