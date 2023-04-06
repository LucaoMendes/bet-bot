'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('users_profiles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        reference: 'users',        
        unique: true,
      },
      min_odd: Sequelize.DOUBLE,
      max_odd: Sequelize.DOUBLE,
      team_priority: Sequelize.STRING,
      max_matches: Sequelize.INTEGER,
      max_multiples: Sequelize.INTEGER,
      bet_value: Sequelize.DOUBLE,
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
    await queryInterface.dropTable('users_profiles')
  }
};
