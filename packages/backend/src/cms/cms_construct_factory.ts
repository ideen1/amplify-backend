import {
  ConstructContainerEntryGenerator,
  ConstructFactory,
  ConstructFactoryGetInstanceProps,
} from '@aws-amplify/plugin-types';
import { CmsConstruct } from './cms_construct.js';
import { Construct } from 'constructs';

export class CmsConstructFactory implements ConstructFactory<CmsConstruct> {
  private generator: ConstructContainerEntryGenerator;

  getInstance(props: ConstructFactoryGetInstanceProps): CmsConstruct {
    if (!this.generator) {
      this.generator = new CmsConstructGenerator(props);
    }
    return props.constructContainer.getOrCompute(this.generator);
  }
}

class CmsConstructGenerator implements ConstructContainerEntryGenerator {
  readonly resourceGroupName = 'cms';
  private readonly defaultName = 'amplifyCms';

  constructor(
    private readonly getInstanceProps: ConstructFactoryGetInstanceProps
  ) {}

  generateContainerEntry = (scope: Construct) => {
    return new CmsConstruct(scope, 'cms');
  };
}
