const { User } = require("@models/User");
const { UserSetting } = require("@models/UserSetting");
const { BoardDisplaySetting } = require("@models/BoardDisplaySetting");

const updateData = require("@service/updateData");

async function initUser(userId) {
  await UserSetting.create({
    UserId: userId,
  });

  const boards = [
    await BoardDisplaySetting.build({ UserId: userId }),
    await BoardDisplaySetting.build({ UserId: userId }),
  ];
  
  boards[0].setBoardTypeByName("MJUHome");
  boards[1].setBoardTypeByName("Myiweb");

  for (let b in boards) await boards[b].save();

  const user = await User.findByPk(userId);
  if (user.majorDeptCode) {
    boards.push(
      await BoardDisplaySetting.build({
        UserId: userId,
      })
    );

    boards[2].setBoardTypeByName("JW4Dept");

    await boards[2].save();
  }

  await updateData(userId);
}

module.exports = initUser;
