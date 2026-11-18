# infra/cdk-mini

Real AWS CDK (TypeScript) stack: `MiniHookPlatformReadApiStack` wires a
Node.js Lambda running `apps/mini-read-api-service/src/lambda.ts`'s handler
behind an API Gateway HTTP API, with 4 routes matching the service's local
HTTP routes.

## Run locally (no AWS account/credentials needed for synth)

```bash
npm install
npm run synth   # cdk synth — renders the CloudFormation template to cdk.out/
```

`cdk deploy` is **not** run as part of this challenge/scaffold — only
`cdk synth` needs to succeed. Deploying to a real AWS account (backend →
AWS, per the Part A requirement) is left to whoever does Part A, using their
own AWS credentials.
