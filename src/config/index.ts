
import dotenv from "dotenv";
const envFound = dotenv.config({ path: `./.env` });
if (!envFound) throw new Error("Couldn't find .env file");

export default {
  port: process.env.APP_PORT,

  logs: { level: process.env.LOG_LEVEL || "silly" },

  DB_ADMIN_USERNAME: process.env.DB_ADMIN_USERNAME,
  DB_ADMIN_PASSWORD: process.env.DB_ADMIN_PASSWORD,

  DB_HOST_NAME: process.env.DB_HOST_NAME,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,

  MAIL_DRIVER: process.env.MAIL_DRIVER,
  MAIL_PORT: process.env.MAIL_PORT,
  MAIL_HOST: process.env.MAIL_HOST,
  MAIL_ENCRYPTION: process.env.MAIL_ENCRYPTION,
  MAIL_FROM_NAME: process.env.MAIL_FROM_NAME,
  MAIL_FROM_ADDRESS: process.env.MAIL_FROM_ADDRESS,

  DATABASE_POOL_MIN: process.env.DATABASE_POOL_MIN,
  DATABASE_POOL_MAX: process.env.DATABASE_POOL_MAX,
  DATABASE_POOL_IDLE: process.env.DATABASE_POOL_IDLE,

  JWT_SECRET: process.env.JWT_SECRET,
  JWT_SECRET_REFRESH: process.env.JWT_SECRET_REFRESH,
  JWT_SECRET_EXPIRES: process.env.JWT_SECRET_EXPIRES,
  JWT_SECRET_EXPIRES_NO_REMEMBER_ME: process.env.JWT_SECRET_EXPIRES_NO_REMEMBER_ME,


  WEBSITE_URL: process.env.WEBSITE_URL,

  API_URL: process.env.API_URL,
  API_BASE_URL: process.env.API_BASE_URL,
  NODE_ENV: process.env.NODE_ENV,

  AWS_S3_REGION: process.env.AWS_S3_REGION,
  AWS_ACCESS_KEY: process.env.AWS_ACCESS_KEY,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_BUCKET: process.env.AWS_BUCKET,
};

export const USER_STATUS = {
  draft: 0,
  active: 1,
  deactive: 2
};

export const USER_ROLE = {
  Admin: 1,
  Customer: 2,
  Player: 3
}

export const PAGE_SIZE = {
  Standand: 10,
};

export const COMMON_STATUS = {
  Inactive: 0,
  Active: 1,
  ALL: 2
};

export const IS_DELETED = {
  Yes: 1,
  No: 0
}

export const STORAGE_TYPE = {
  S3: 's3'
}

export const STORAGE_FOLDER = {
  LASY: 'lasy',
}

export const TYPE_QUESTION = {
  CHECKBOX: 1,
  TEXT: 2
}