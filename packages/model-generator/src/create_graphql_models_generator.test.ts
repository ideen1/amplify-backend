import assert from 'node:assert';
import { describe, it } from 'node:test';
import { AwsCredentialIdentityProvider } from '@aws-sdk/types';
import { BackendIdentifier } from '@aws-amplify/client-config';
import { createGraphqlModelsGenerator } from './create_graphql_models_generator.js';

describe('models generator factory', () => {
  it('throws an error if a null backendIdentifier is passed in', async () => {
    assert.throws(() =>
      createGraphqlModelsGenerator({
        backendIdentifier: null as unknown as BackendIdentifier,
        credentialProvider: null as unknown as AwsCredentialIdentityProvider,
      })
    );
  });

  it('throws an error if a null backendIdentifier is passed in', async () => {
    assert.throws(() =>
      createGraphqlModelsGenerator({
        backendIdentifier: { stackName: 'foo' },
        credentialProvider: null as unknown as AwsCredentialIdentityProvider,
      })
    );
  });
});
