import User from "../../models/User";

interface Request {
  userId: number;
  online: boolean;
}

const UpdateUserOnlineStatusService = async ({
  userId,
  online
}: Request): Promise<void> => {
  await User.update(
    {
      online,
      lastSeen: new Date()
    },
    {
      where: { id: userId }
    }
  );
};

export default UpdateUserOnlineStatusService;
