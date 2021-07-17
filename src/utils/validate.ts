import Joi from "joi";
import moment from "moment";

export default class MsValidate {
  private joi: Joi.AnySchema;

  public validateSignup(signupObj: any) {
    const object = {
      password: Joi.string().min(6)
        .required(),
      email: Joi.string()
        .email({ minDomainSegments: 2 }),
      full_name: Joi.string(),
      phone: Joi.allow(),
      address: Joi.string(),
    };
    return this.setUpJoi(object, signupObj);
  }

  public validateUpateUser(userObj: any) {
    const object = {
      full_name: Joi.string(),
      phone: Joi.string(),
      address: Joi.string(),
    };
    return this.setUpJoi(object, userObj);
  }

  public validateUpdateAssessment(obj: any) {
    const object = {
      title: Joi.string().required(),
      join_key: Joi.string().required(),
      time: Joi.number().required(),
      user_id: Joi.number().required(),
      number_of_question: Joi.number().required(),
      description: Joi.string().allow(''),
      questions: Joi.array().required(),
      status: Joi.number().allow(null),
    };
    return this.setUpJoi(object, obj);
  }

  private setUpJoi(objectInit: any, objectUpdate: any) {
    this.joi = Joi.object(objectInit);
    return this.joi.validateAsync(objectUpdate);
  }

  public validateCheckMail(signupObj: any) {
    const object = {
      email: Joi.string()
        .email({ minDomainSegments: 2 })
    };
    return this.setUpJoi(object, signupObj);
  }
}