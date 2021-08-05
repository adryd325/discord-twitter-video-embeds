import path from "path";
import sequelize from "sequelize";
import { DATABASE_PATH } from "./constants.js";

const { Sequelize } = sequelize;

export default new Sequelize({
	dialect: "sqlite",
	storage: path.join(DATABASE_PATH),
	logging: () => {}
});
