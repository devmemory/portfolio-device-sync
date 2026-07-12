import { ConverationApi } from "./routes/ConversationApi";
import { DeviceApi } from "./routes/DeviceApi";
import { LocalApi } from "./routes/LocalApi";
import { UserApi } from "./routes/UserApi";

export const apiManager = {
  get userApi() {
    return new UserApi();
  },
  get deviceApi() {
    return new DeviceApi();
  },
  get localApi() {
    return new LocalApi();
  },
  get conversationApi() {
    return new ConverationApi();
  },
};
