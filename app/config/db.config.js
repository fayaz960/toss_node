module.exports = {
  HOST: "localhost",   // local
  USER: "root",
  PASSWORD: "",

  DB: "toss_academy",
  dialect: "mysql",
  dialectOptions: {
    useUTC: false,
  },
  timezone: "+05:30",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};
