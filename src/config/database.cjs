const credentials = {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    dialect: "mysql",
    seederStorage: "sequelize",
    seederStorageTableName: "SequelizeData",
};

module.exports = {
  development: {
    ...credentials,
    logging : false
  },
  test: {
    ...credentials,
    logging : false
  },
  production: {
    ...credentials,
    logging : false
  }
}