import { getClient } from "grpc/client.ts";
import { Authenticator } from "./authenticator.d.ts";

const protoPath = new URL("./authenticator.proto", import.meta.url);
const protoFile = await Deno.readTextFile(protoPath);

const client = getClient<Authenticator>({
  port: 50051,
  root: protoFile,
  serviceName: "Authenticator",
});

const { accessToken } = await client.Signin({ name: "sno2wman", password: "password" });
if (accessToken) {
  const validate = await client.Validate({ accessToken: accessToken });
  console.log(validate.userId);
}

/* unary calls */

client.close();
