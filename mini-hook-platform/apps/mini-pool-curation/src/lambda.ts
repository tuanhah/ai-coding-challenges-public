import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { handleRequest } from "./handlers.js";

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const method = event.requestContext.http.method;
  const path = event.requestContext.http.path;
  const result = handleRequest(method, path, event.body ?? "");
  return {
    statusCode: result.status,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(result.body),
  };
}
