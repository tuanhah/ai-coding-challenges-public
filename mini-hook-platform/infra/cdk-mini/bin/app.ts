#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { MiniReadApiStack } from "../lib/mini-read-api-stack";

const app = new cdk.App();

// Demo-only env: no real AWS account/region is targeted by `cdk synth`.
// A real `cdk deploy` would need CDK_DEFAULT_ACCOUNT/CDK_DEFAULT_REGION from
// an actual AWS credential, which this scaffold intentionally never reads.
new MiniReadApiStack(app, "MiniHookPlatformReadApiStack", {
  description: "mini-hook-platform demo stack: Lambda + HTTP API for mini-read-api-service",
});
