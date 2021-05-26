module.exports = (req, res, next) => {
  const { user } = req;

  if (!user.isUserEmailVerified) {
    return res.status(403).send({
      error: "UNVERIFIED_USER_EMAIL",
    });
  }

  next();
};
