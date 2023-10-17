import { getModelIntrospectionSchemaFromS3Uri } from '@aws-amplify/model-generator';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';

export const handler = async () => {
  console.log('fooo');
  try {
    await getModelIntrospectionSchemaFromS3Uri({
      modelSchemaS3Uri: 's3://foo/bar',
      credentialProvider: fromNodeProviderChain(),
    });
  } catch (e) {
    console.log(e);
  }
};
