import config from "@src/config";
import UserModel from "@src/models/user";
import ejs from "ejs";
import fs from "fs";
import nodemailer from "nodemailer";

export default class MailUtils {
  private transporter: any;
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.MAIL_HOST,
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: "ramon.schmidt51@ethereal.email", // generated ethereal user
        pass: "H51zExJ4qdkN79F6qW/W/QmHfJR", // generated ethereal password
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  public activeAccount(email: string, token: string, user: UserModel = null) {
    try {
      const subject = "Lasy Shop Sign up Confirmation";
      const fileTemplate = "activeAccount";
      return new Promise((resolve, reject) => {
        const url = `${config.WEBSITE_URL}/active-account?token=${encodeURIComponent(token)}`;
        ejs.renderFile(`./templates/${fileTemplate}.ejs`, { mainUrl: url }, async (err, data) => {
          if (err) {
            console.log(err);
            reject(err);
          }
          const result = await this.sendMail(email, subject, data);
          resolve(result);
        });
      });
    } catch (error) {
      throw error;
    }
  }

  private async sendMail(to: string, subject: string, html: any) {
    try {
      const info = await this.transporter.sendMail({
        from: config.MAIL_FROM_ADDRESS, // sender address
        to,
        subject,
        html,
      });
      console.log("Message sent: %s", info);
      return info;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
}