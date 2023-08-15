## API Report File for "@aws-amplify/plugin-types"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

import { Construct } from 'constructs';
import { IRole } from 'aws-cdk-lib/aws-iam';
import { IUserPool } from 'aws-cdk-lib/aws-cognito';
import { Stack } from 'aws-cdk-lib';

// @public
export type AuthResources = {
    authenticatedUserIamRole: IRole;
    unauthenticatedUserIamRole: IRole;
    userPool?: IUserPool;
    identityPoolId?: string;
};

// @public (undocumented)
export type BackendOutput = Record<string, BackendOutputEntry>;

// @public (undocumented)
export type BackendOutputEntry<T extends Record<string, string> = Record<string, string>> = {
    readonly version: string;
    readonly payload: T;
};

// @public (undocumented)
export type BackendOutputRetrievalStrategy = {
    fetchBackendOutput(): Promise<BackendOutput>;
};

// @public
export type BackendOutputStorageStrategy<T extends BackendOutputEntry> = {
    addBackendOutputEntry(keyName: string, backendOutputEntry: T): void;
    flush(): void;
};

// @public
export type BackendOutputWriter = {
    storeOutput(outputStorageStrategy: BackendOutputStorageStrategy<BackendOutputEntry>): void;
};

// @public
export type ConstructContainer = {
    getOrCompute(generator: ConstructContainerEntryGenerator): Construct;
    registerConstructFactory(token: string, provider: ConstructFactory): void;
    getConstructFactory<T>(token: string): ConstructFactory<T>;
};

// @public
export type ConstructContainerEntryGenerator = {
    resourceGroupName: string;
    generateContainerEntry(scope: Construct): Construct;
};

// @public
export type ConstructFactory<T = unknown> = {
    readonly provides?: string;
    getInstance(props: ConstructFactoryGetInstanceProps): T;
};

// @public (undocumented)
export type ConstructFactoryGetInstanceProps = {
    constructContainer: ConstructContainer;
    outputStorageStrategy: BackendOutputStorageStrategy<BackendOutputEntry>;
    importPathVerifier?: ImportPathVerifier;
};

// @public
export type ImportPathVerifier = {
    verify(importStack: string | undefined, expectedImportingFile: string, errorMessage: string): void;
};

// @public
export type MainStackCreator = {
    getOrCreateMainStack(): Stack;
};

// @public
export type MainStackNameResolver = {
    resolveMainStackName(): Promise<string>;
};

// @public
export type UniqueBackendIdentifier = {
    appName: string;
    disambiguator: string;
    branchName: string;
};

// (No @packageDocumentation comment for this package)

```