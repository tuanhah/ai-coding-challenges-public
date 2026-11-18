import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as logs from "aws-cdk-lib/aws-logs";
import * as path from "node:path";

/**
 * Real CDK stack for mini-read-api-service: a Lambda (Node.js runtime,
 * running the same handler as src/lambda.ts) fronted by an HTTP API
 * (API Gateway v2). Storage is the same file-based JSON "DB" used for local
 * dev (DynamoDB-local/SQLite swap-in is a drop-in change to
 * apps/mini-read-api-service/src/handlers.ts, left for a later iteration —
 * this stack's job is to prove the Lambda + HTTP API wiring synths cleanly).
 *
 * `cdk deploy` is intentionally NOT run as part of this challenge scaffold —
 * only `cdk synth` is expected to succeed locally, with no AWS credentials.
 */
export class MiniReadApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const readApiFn = new lambda.Function(this, "MiniReadApiFunction", {
      functionName: "mini-read-api-service",
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "lambda.handler",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "..", "..", "..", "apps", "mini-read-api-service", "src")
      ),
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      logRetention: logs.RetentionDays.ONE_WEEK,
      environment: {
        MINI_POOL_ACTIVITY_DATA_FILE: "/tmp/mini-pool-activity.json",
        MINI_POSITION_DATA_FILE: "/tmp/mini-position.json",
      },
    });

    const httpApi = new apigwv2.HttpApi(this, "MiniReadApiHttpApi", {
      apiName: "mini-read-api-service",
      description: "HTTP API for mini-read-api-service (pool activity history + position ownership reads)",
    });

    const integration = new integrations.HttpLambdaIntegration("MiniReadApiIntegration", readApiFn);

    httpApi.addRoutes({
      path: "/pools",
      methods: [apigwv2.HttpMethod.GET],
      integration,
    });
    httpApi.addRoutes({
      path: "/pools/{poolId}/history",
      methods: [apigwv2.HttpMethod.GET],
      integration,
    });
    httpApi.addRoutes({
      path: "/owners/{address}/positions",
      methods: [apigwv2.HttpMethod.GET],
      integration,
    });
    httpApi.addRoutes({
      path: "/positions/{tokenId}",
      methods: [apigwv2.HttpMethod.GET],
      integration,
    });

    new cdk.CfnOutput(this, "MiniReadApiUrl", {
      value: httpApi.apiEndpoint,
      description: "Invoke URL for mini-read-api-service HTTP API (demo only, not deployed in this challenge)",
    });
  }
}
