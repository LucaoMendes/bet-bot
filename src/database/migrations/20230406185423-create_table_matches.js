'use strict'
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('matches', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      home_team_id: Sequelize.INTEGER,
      home: Sequelize.JSON,
      away_team_id: Sequelize.INTEGER,
      away: Sequelize.JSON,
      league_id: Sequelize.INTEGER,
      league: Sequelize.JSON,
      challenge_id:Sequelize.INTEGER,
      challenge: Sequelize.JSON,
      season_id:Sequelize.INTEGER,
      season: Sequelize.JSON,
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      slug: Sequelize.STRING,
      time_details: Sequelize.JSON,
      status: Sequelize.STRING,
      status_more: Sequelize.STRING,
      start_at: Sequelize.DATE,
      priority: Sequelize.INTEGER,
      home_score: Sequelize.JSON,
      away_score: Sequelize.JSON,
      winner_code: Sequelize.INTEGER,
      round_number: Sequelize.INTEGER,
      main_odds: Sequelize.JSON,
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
    await queryInterface.dropTable('matches')
  }
}