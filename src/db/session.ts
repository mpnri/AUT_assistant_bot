import mongoose, { ClientSession } from "mongoose";


export const useTransaction = async (callback: (session: ClientSession) => Promise<any>) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  return callback(session)
    .then(() => {
      return session.commitTransaction();
    })
    .catch((err) => {
      session.abortTransaction();
      throw err;
    })
    .finally(() => {
      session.endSession();
    });
};
