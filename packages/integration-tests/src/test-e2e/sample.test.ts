import { after, afterEach, before, beforeEach, describe, it } from 'node:test';
import { amplifyAppPool } from './amplify_app_pool.js';
import {
  AmplifyClient,
  GetBranchCommand,
  UpdateBranchCommand,
  UpdateBranchCommandInput,
} from '@aws-sdk/client-amplify';

void it('tests sdk', async () => {
  const newBranch = await amplifyAppPool.createTestBranch();

  const amplifyClient = new AmplifyClient();

  let branch = (
    await amplifyClient.send(
      new GetBranchCommand({
        appId: newBranch.appId,
        branchName: newBranch.branchName,
      })
    )
  ).branch;

  console.log('After first read');
  console.log(JSON.stringify(branch, null, 2));

  const updateBranch: UpdateBranchCommandInput = {
    appId: newBranch.appId,
    branchName: newBranch.branchName,
    ...branch,
  };

  if (!updateBranch.backend) {
    console.log('setting backend to {}');
    updateBranch.backend = {};
  }
  const sampleStackArn =
    'arn:aws:cloudformation:us-west-2:595032847868:stack/amplify-foo-cde/efg';
  updateBranch.backend.stackArn = sampleStackArn;

  //fix that stupid stage
  updateBranch.stage = undefined;

  console.log('Updating with');
  console.log(JSON.stringify(updateBranch, null, 2));

  await amplifyClient.send(new UpdateBranchCommand(updateBranch));

  branch = (
    await amplifyClient.send(
      new GetBranchCommand({
        appId: newBranch.appId,
        branchName: newBranch.branchName,
      })
    )
  ).branch;

  console.log('After second read');
  console.log(JSON.stringify(branch, null, 2));
});
