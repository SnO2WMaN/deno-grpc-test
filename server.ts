import { GrpcServer } from "grpc/server.ts";
import { error, Status } from "grpc/error.ts";
import { Authenticator } from "./authenticator.d.ts";
import { create as createJWT, decode, getNumericDate, Payload, verify as validateJWT } from "djwt/mod.ts";

const port = 50051;
const server = new GrpcServer();

const protoPath = new URL("./authenticator.proto", import.meta.url);
const protoFile = await Deno.readTextFile(protoPath);

const key = await crypto.subtle.generateKey(
  { name: "HMAC", hash: "SHA-512" },
  true,
  ["sign", "verify"],
);

const users = [
  { id: "1", name: "sno2wman", email: "me@sno2wman.net", password: "password" },
];

server.addService<Authenticator>(protoFile, {
  async Signin({ name, password }) {
    const user = users.find((user) => user.name === name || user.email === name);
    if (!user) {
      throw error(Status.NOT_FOUND, `no user found for "${name}"`);
    }

    if (user.password !== password) {
      throw error(Status.UNAUTHENTICATED, "wrong password");
    }

    const accessToken = await createJWT(
      { alg: "HS512" },
      { aud: "example.com", sub: user.id, exp: getNumericDate(60 * 60) },
      key,
    );

    return { accessToken: accessToken };
  },
  async Validate({ accessToken }) {
    if (!accessToken) throw error(Status.INVALID_ARGUMENT);

    const payload = await validateJWT(accessToken, key, { audience: ["example.com"] });
    if (!payload.sub) throw error(Status.UNAUTHENTICATED);

    return { userId: payload.sub };
  },
});

console.log(`gonna listen on ${port} port`);
for await (const conn of Deno.listen({ port })) {
  server.handle(conn);
}
