const ServiceQueue = require("@util/ServiceQueue");

const { User } = require("@models/User");
const { UserSetting } = require("@models/UserSetting");
const { use } = require("../routes/anncmnt");

const delay = 15000;

async function sendNotification(userId) {
  const serviceQueue = new ServiceQueue("SendNotification");

  try {
    await serviceQueue.initTable();

    serviceQueue.addServiceToUser(userId, delay);

    serviceQueue.runServices(async (userId) => {
      try {
        const user = await User.findByPk(userId);
        const userSetting = await UserSetting.findOne({
          where: {
            UserId: userId,
          },
        });

        if (user.isUserEmailVerified && userSetting.notifyByUserEmail) {
          await user.sendNotification(true);
        } else if (user.isMjuEmailVerified) {
          await user.sendNotification(false);
        }
      } catch (err) {
        console.error(err);
      }
    });
  } catch (err) {
    throw err;
  }
}

module.exports = sendNotification;
