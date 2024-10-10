import { env } from "process";

const getUsername = () => {
  return env.npm_config_username;
};

export default getUsername;
