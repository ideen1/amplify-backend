import { Construct } from 'constructs';
import {
  AuthResources,
  BackendOutputStorageStrategy,
  ConstructContainerEntryGenerator,
  ConstructFactory,
  ConstructFactoryGetInstanceProps,
  ResourceProvider,
} from '@aws-amplify/plugin-types';
import {
  AmplifyGraphqlApi,
  AmplifyGraphqlApiProps,
  AuthorizationConfig,
} from '@aws-amplify/graphql-construct-alpha';
import { GraphqlOutput } from '@aws-amplify/backend-output-schemas/graphql';

export type DataProps = Pick<AmplifyGraphqlApiProps, 'schema'>;

/**
 * Singleton factory for AmplifyGraphqlApi constructs that can be used in Amplify project files
 */
export class DataFactory implements ConstructFactory<AmplifyGraphqlApi> {
  private generator: ConstructContainerEntryGenerator;
  private readonly importStack: string | undefined;

  /**
   * Create a new AmplifyConstruct
   */
  constructor(private readonly props: DataProps) {
    this.importStack = new Error().stack;
  }

  /**
   * Gets an instance of the Data construct
   */
  getInstance = ({
    constructContainer,
    outputStorageStrategy,
    importPathVerifier,
  }: ConstructFactoryGetInstanceProps): AmplifyGraphqlApi => {
    importPathVerifier?.verify(
      this.importStack,
      'data',
      'Amplify Data must be defined in a "data.ts" file'
    );
    if (!this.generator) {
      this.generator = new DataGenerator(
        this.props,
        constructContainer
          .getConstructFactory<ResourceProvider<AuthResources>>('AuthResources')
          .getInstance({
            constructContainer,
            outputStorageStrategy,
            importPathVerifier,
          }),
        outputStorageStrategy
      );
    }
    return constructContainer.getOrCompute(this.generator) as AmplifyGraphqlApi;
  };
}

class DataGenerator implements ConstructContainerEntryGenerator {
  readonly resourceGroupName = 'data';
  private readonly defaultName = 'amplifyData';

  constructor(
    private readonly props: DataProps,
    private readonly authResources: ResourceProvider<AuthResources>,
    private readonly outputStorageStrategy: BackendOutputStorageStrategy<GraphqlOutput>
  ) {}

  generateContainerEntry = (scope: Construct) => {
    const authConfig: AuthorizationConfig = {
      iamConfig: {
        authenticatedUserRole:
          this.authResources.resources.authenticatedUserIamRole,
        unauthenticatedUserRole:
          this.authResources.resources.unauthenticatedUserIamRole,
        identityPoolId:
          this.authResources.resources.cfnResources.identityPool.logicalId,
      },
    };
    if (this.authResources.resources.userPool) {
      authConfig.userPoolConfig = {
        userPool: this.authResources.resources.userPool,
      };
      authConfig.defaultAuthMode = 'AMAZON_COGNITO_USER_POOLS';
    }

    // TODO inject the construct with the functionNameMap
    const graphqlConstructProps: AmplifyGraphqlApiProps = {
      schema: this.props.schema,
      authorizationConfig: authConfig,
      outputStorageStrategy: this.outputStorageStrategy,
    };
    const graphqlConstruct = new AmplifyGraphqlApi(
      scope,
      this.defaultName,
      graphqlConstructProps
    );

    return graphqlConstruct;
  };
}

export const Data = DataFactory;