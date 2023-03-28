
require('dotenv').config()
module.exports = {
    dialect: process.env.DATABASE_DIALECT,
    host: process.env.DATABASE_HOST,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    logging : process.env.DATABASE_LOGGING,
    define: {
        timestamps: process.env.DATABASE_TIMESTAMP,
        underscored: process.env.DATABASE_UNDERSCORE
    },
}