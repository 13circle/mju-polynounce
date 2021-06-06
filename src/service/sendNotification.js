const ServiceQueue = require("@util/ServiceQueue");

const { User } = require("@models/User");
const { UserSetting } = require("@models/UserSetting");

const delay = 15000;

async function sendNotification(userId) {
  const serviceQueue = new ServiceQueue("SendNotification");

  try {
    await serviceQueue.initTable();

    const userSetting = await UserSetting.findOne({
      where: {
        UserId: userId,
      },
    });

    if (userSetting.enableNotification) {
      const user = await User.findByPk(userId);

      serviceQueue.addServiceToUser(userId, delay);

      serviceQueue.runServices(async (userId) => {
        try {
          if (user.isUserEmailVerified && userSetting.notifyByUserEmail) {
            await user.sendNotification(true);
          } else if (user.isMjuEmailVerified) {
            await user.sendNotification(false);
          }
        } catch (err) {
          console.error(err);
        }
      });
    }
  } catch (err) {
    throw err;
  }
}

module.exports = sendNotification;
