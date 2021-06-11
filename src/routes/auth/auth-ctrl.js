const authCtrl = {};

const Joi = require("joi");

const { User } = require("@models/User");
const { UserSetting } = require("@models/UserSetting");
const jw4DeptCode = require("@config/jw4DeptCode");
const initUser = require("@util/init-user");

authCtrl.loginPage = (req, res) => {
  res.status(200).render("auth/login.html");
};

authCtrl.editPage = (req, res) => {
  res.status(200).render("auth/edit.html");
};

authCtrl.registrationPage = (req, res) => {
  res.status(200).render("auth/register.html");
};

authCtrl.emailConfirmPage = (req, res) => {
  const { token } = req.params;
  res.status(200).render("auth/confirmEmail.ejs", { token });
};

authCtrl.passwordResetPage = (req, res) => {
  const { token } = req.params;
  res.status(200).render("auth/resetPassword.ejs", { token });
};

authCtrl.login = (req, res) => {
  req.session.save(() => {
    res.redirect("/");
  });
};

authCtrl.logout = (req, res) => {
  req.logout();
  req.session.destroy(() => {
    res.redirect("/");
  });
};

authCtrl.check = async (req, res) => {
  const { user } = req;
  if (!user) {
    return res.status(200).send({
      isLogin: false,
    });
  }

  res.status(200).send({
    isLogin: true,
  });
};

authCtrl.register = async (req, res) => {
  const schema = Joi.object({
    userEmail: Joi.string().email().required(),
    userPwd: Joi.string().min(8).max(255).required(),
    studId: Joi.string()
      .pattern(/^[0-9]*$/)
      .required(),
    studPwd: Joi.string().required(),
    majorDeptCode: Joi.string()
      .alphanum()
      .valid(...Object.keys(jw4DeptCode), "")
      .optional(),
    mjuEmail: Joi.string().email().optional(),
  });

  const result = schema.validate(req.body);

  if (result.error) {
    delete result.error._original;
    return res.status(400).send(result.error.details);
  }

  const { userEmail, userPwd, studId, studPwd, majorDeptCode, mjuEmail } =
    req.body;

  try {
    const user = await User.build({
      userEmail,
      userPwd: "",
      studId,
      studPwd,
      majorDeptCode: majorDeptCode === "" ? null : majorDeptCode,
      mjuEmail,
    });

    const isStudValid = await User.checkStudAccount(studId, studPwd);
    if (!isStudValid) {
      return res.status(401).send({
        error: "INVALID_STUD_ACCOUNT",
      });
    }

    await user.hashUserPassword(userPwd);
    user.encryptStudPassword(studPwd);

    await user.save();

    await user.sendEmailVerification(false);
    if (mjuEmail) {
      await user.sendEmailVerification(true);
    }

    await initUser(user.id);

    res.redirect("/");
  } catch (err) {
    const { original } = err;

    if (original) {
      const { code } = original;

      if (code === "ER_DUP_ENTRY") {
        res.status(409).send({
          error: "DUP_USER_INFO",
          dupFields: err.fields,
        });
      } else {
        throw err;
      }
    } else {
      res
        .status(500)
        .send(Error("Interal Server Error: Please contact to admin"));
      throw err;
    }
  }
};

authCtrl.confirmEmail = async (req, res) => {
  const { token } = req.params;
  if (!token) {
    return res.status(400).send({
      error: "NO_EMAIL_TOKEN",
    });
  }

  const decoded = User.decodeToken(token);
  if (!decoded) {
    return res.status(401).send({
      error: "INVALID_EMAIL_TOKEN",
    });
  }

  const { id, exp, isMjuEmail } = decoded;

  try {
    const user = await User.findOne({ where: { id } });
    if (!user) {
      return res.status(401).send({
        error: "INVALID_USER",
      });
    }

    if (
      (isMjuEmail && user.isMjuEmailVerified) ||
      (!isMjuEmail && user.isUserEmailVerified)
    ) {
      return res.status(409).send({
        error: "REDUNDANT_OVERWRITE",
      });
    }

    if (Date.now() >= exp) {
      return res.status(410).send({
        error: "TOKEN_EXPIRED",
      });
    }

    const updateOption = isMjuEmail
      ? { isMjuEmailVerified: true }
      : { isUserEmailVerified: true };

    await User.update(updateOption, { where: { id } });

    res.status(200).send(user.serialize());
  } catch (err) {
    res
      .status(500)
      .send(Error("Interal Server Error: Please contact to admin"));
    throw err;
  }
};

authCtrl.edit = async (req, res) => {
  const schema = Joi.object({
    userEmail: Joi.string().email().optional(),
    studId: Joi.string()
      .pattern(/^[0-9]*$/)
      .optional(),
    studPwd: Joi.string().optional(),
    majorDeptCode: Joi.string()
      .alphanum()
      .valid(...Object.keys(jw4DeptCode))
      .optional(),
    mjuEmail: Joi.string().email().optional(),
  });

  const result = schema.validate(req.body);

  if (result.error) {
    delete result.error._original;
    return res.status(400).send(result.error.details);
  }

  const { userEmail, studId, studPwd, majorDeptCode, mjuEmail } = req.body;
  const { user } = req;
  const { id } = user;

  try {
    const onChangeFlags = {
      isUserEmailChanged: false,
      isMjuEmailChanged: false,
      isStudIdChanged: false,
      isStudPwdChanged: false,
      isMajorDeptCodeChanged: false,
    };
    const updateOption = {};

    const prevUserEmail = user.userEmail;
    const prevStudId = user.studId;
    const prevStudPwd = user.decryptStudPassword();
    const prevMjuEmail = user.mjuEmail;
    const prevMajorDeptCode = user.majorDeptCode;

    user.userEmail = userEmail;
    user.studId = studId;
    user.encryptStudPassword(studPwd);
    user.mjuEmail = mjuEmail;
    user.majorDeptCode = majorDeptCode;

    const isStudValid = await User.checkStudAccount(studId, studPwd);
    if (!isStudValid) {
      return res.status(401).send({
        error: "INVALID_STUD_ACCOUNT",
      });
    } else {
      if (prevStudId !== studId) {
        onChangeFlags.isStudIdChanged = true;
        updateOption.studId = studId;
      }

      if (prevStudPwd !== studPwd) {
        onChangeFlags.isStudPwdChanged = true;
        updateOption.studPwd = user.studPwd;
      }

      if (prevMajorDeptCode !== majorDeptCode) {
        onChangeFlags.isMajorDeptCodeChanged = true;
        updateOption.majorDeptCode = user.majorDeptCode;
      }
    }

    if (userEmail) {
      if (userEmail !== prevUserEmail) {
        onChangeFlags.isUserEmailChanged = true;
        updateOption.userEmail = userEmail;
        updateOption.isUserEmailVerified = false;

        await user.sendEmailVerification(false);
      }
    }

    if (mjuEmail && prevMjuEmail) {
      if (mjuEmail !== prevMjuEmail) {
        onChangeFlags.isMjuEmailChanged = true;
        updateOption.mjuEmail = mjuEmail;
        updateOption.isMjuEmailVerified = false;

        await user.sendEmailVerification(true);
      }
    }

    await User.update(updateOption, { where: { id } });

    res.status(200).send(onChangeFlags);
  } catch (err) {
    res
      .status(500)
      .send(Error("Interal Server Error: Please contact to admin"));
    throw err;
  }
};

authCtrl.editSetting = async (req, res) => {
  const schema = Joi.object({
    enableNotification: Joi.boolean().optional(),
    notifyByUserEmail: Joi.boolean().optional(),
    updateInterval: Joi.number().integer().optional(),
    toggleDarkMode: Joi.boolean().optional(),
  });

  const result = schema.validate(req.body);

  if (result.error) {
    delete result.error._original;
    return res.status(400).send(result.error.details);
  }

  const {
    enableNotification,
    notifyByUserEmail,
    updateInterval,
    toggleDarkMode,
  } = req.body;

  const onChangeFlags = {
    isEnableNotifChanged: false,
    isNotifByUserMailChanged: false,
    isUpdateIntervalChanged: false,
    isToggleDarkModeChanged: false,
  };

  const updateOption = {};

  const {
    user: { id },
  } = req;

  try {
    const userSetting = await UserSetting.findOne({
      where: {
        UserId: id,
      },
    });

    if (userSetting.enableNotification !== enableNotification) {
      onChangeFlags.isEnableNotifChanged = true;
      updateOption.enableNotification = enableNotification;
    }

    if (userSetting.notifyByUserEmail !== notifyByUserEmail) {
      onChangeFlags.isNotifByUserMailChanged = true;
      updateOption.notifyByUserEmail = notifyByUserEmail;
    }

    if (userSetting.updateInterval !== updateInterval) {
      onChangeFlags.isUpdateIntervalChanged = true;
      updateOption.updateInterval = updateInterval;
    }

    if (userSetting.toggleDarkMode !== toggleDarkMode) {
      onChangeFlags.isToggleDarkModeChanged = true;
      updateOption.toggleDarkMode = toggleDarkMode;
    }

    await UserSetting.update(updateOption, { where: { id } });

    res.status(200).send(onChangeFlags);
  } catch (err) {
    res
      .status(500)
      .send(Error("Interal Server Error: Please contact to admin"));
    throw err;
  }
};

authCtrl.sendPasswordReset = async (req, res) => {
  const { user } = req;

  try {
    await user.sendPasswordResetMail();

    res.status(200).send();
  } catch (err) {
    res
      .status(500)
      .send(Error("Interal Server Error: Please contact to admin"));
    throw err;
  }
};

authCtrl.resetPassword = async (req, res) => {
  const { token } = req.params;
  if (!token) {
    return res.status(400).send({
      error: "NO_PWD_TOKEN",
    });
  }

  const decoded = User.decodeToken(token);
  if (!decoded) {
    return res.status(401).send({
      error: "INVALID_PWD_TOKEN",
    });
  }

  const schema = Joi.object({
    prevUserPwd: Joi.string().min(8).max(255).required(),
    userPwd: Joi.string().min(8).max(255).required(),
  });

  const result = schema.validate(req.body);
  if (result.error) {
    delete result.error._original;
    return res.status(400).send(result.error.details);
  }

  const { prevUserPwd, userPwd } = req.body;
  const { id, exp } = decoded;

  try {
    const user = await User.findOne({ where: { id } });
    if (!user) {
      return res.status(401).send({
        error: "INVALID_USER",
      });
    }

    if (Date.now() >= exp) {
      return res.status(410).send({
        error: "TOKEN_EXPIRED",
      });
    }

    const isPwdMatch = await user.compareUserPassword(prevUserPwd);
    if (!isPwdMatch) {
      return res.status(403).send({
        error: "ER_WRONG_PWD",
      });
    }

    if (prevUserPwd === userPwd) {
      return res.status(409).send({
        error: "REDUNDANT_OVERWRITE",
      });
    }

    await user.hashUserPassword(userPwd);

    await User.update({ userPwd: user.userPwd }, { where: { id } });

    res.status(200).send(user.serialize());
  } catch (err) {
    res
      .status(500)
      .send(Error("Interal Server Error: Please contact to admin"));
    throw err;
  }
};

authCtrl.unregister = async (req, res) => {
  const { id } = req.user;

  req.logout();

  await User.destroy({ where: { id } });

  req.session.destroy(() => {
    res.redirect("/");
  });
};

module.exports = authCtrl;
