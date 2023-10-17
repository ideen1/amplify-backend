import { Construct } from 'constructs';
import { fileURLToPath } from 'url';
import path from 'path';
import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime as LambdaRuntime } from 'aws-cdk-lib/aws-lambda';
import { Duration } from 'aws-cdk-lib';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const resourcesRoot = path.normalize(
  path.join(dirname, 'schema-processor-lambda')
);
const schemaProcessorLambdaFilePath = path.join(
  resourcesRoot,
  'schema_processor.js'
);

export class CmsConstruct extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new NodejsFunction(scope, 'cmsSchemaProcessorLambda', {
      runtime: LambdaRuntime.NODEJS_18_X,
      memorySize: 1024,
      timeout: Duration.seconds(10),
      entry: schemaProcessorLambdaFilePath,
      handler: 'handler',
      bundling: {
        target: 'node18',
        esbuildArgs: {
          '--define:global.window': 'undefined',
        },
      },
    });
  }
}
