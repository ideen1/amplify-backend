import {
  CreateAuthChallengeTriggerEvent,
  DefineAuthChallengeTriggerEvent,
  VerifyAuthChallengeResponseTriggerEvent,
} from 'aws-lambda';
import { ChallengeResult, PasswordlessClientMetaData } from '../types.js';
import { CognitoMetadataKeys } from '../constants.js';

export const baseEvent = {
  version: '1',
  region: 'us-east-1',
  userPoolId: 'us-east-1_12345678',
  userName: '12345678-1234-1234-1234-123456789012',
  callerContext: {
    awsSdkVersion: 'aws-sdk-unknown-unknown',
    clientId: '12345678',
  },
};

export const phoneUserAttributes = {
  sub: '12345678-1234-1234-1234-123456789012',
  phone_number: '+15555555555',
  phone_number_verified: 'true',
};
export const emailUserAttributes = {
  sub: '12345678-1234-1234-1234-123456789012',
  email_verified: 'true',
  email: 'foo@example.com',
};

const baseRequest = {
  userAttributes: emailUserAttributes,
  userNotFound: false,
};

// Client metadata when requesting a magic link.
export const requestMagicLinkMetaData: PasswordlessClientMetaData = {
  [CognitoMetadataKeys.SIGN_IN_METHOD]: 'MAGIC_LINK',
  [CognitoMetadataKeys.ACTION]: 'REQUEST',
  [CognitoMetadataKeys.DELIVERY_MEDIUM]: 'EMAIL',
  [CognitoMetadataKeys.REDIRECT_URI]:
    'https://example.com/sign-in-link/##code##',
};

// Client metadata when requesting an OTP via email.
export const requestOtpEmailMetaData: PasswordlessClientMetaData = {
  [CognitoMetadataKeys.SIGN_IN_METHOD]: 'OTP',
  [CognitoMetadataKeys.ACTION]: 'REQUEST',
  [CognitoMetadataKeys.DELIVERY_MEDIUM]: 'EMAIL',
};

// Client metadata when requesting an OTP via SMS.
export const requestOtpSmsMetaData: PasswordlessClientMetaData = {
  [CognitoMetadataKeys.SIGN_IN_METHOD]: 'OTP',
  [CognitoMetadataKeys.ACTION]: 'REQUEST',
  [CognitoMetadataKeys.DELIVERY_MEDIUM]: 'SMS',
};

// Client metadata when requesting an OTP via SMS.
export const confirmOtpMetaData: PasswordlessClientMetaData = {
  [CognitoMetadataKeys.SIGN_IN_METHOD]: 'OTP',
  [CognitoMetadataKeys.ACTION]: 'CONFIRM',
};

// Client metadata when requesting an OTP via SMS.
export const confirmMagicLinkMetaData: PasswordlessClientMetaData = {
  [CognitoMetadataKeys.SIGN_IN_METHOD]: 'MAGIC_LINK',
  [CognitoMetadataKeys.ACTION]: 'CONFIRM',
};

/**
 * Creates a mock event for Define Auth Challenge.
 */
export const buildDefineAuthChallengeEvent = (
  previousSessions?: ChallengeResult[],
  clientMetadata?: PasswordlessClientMetaData | Record<string, string>
): DefineAuthChallengeTriggerEvent => {
  return {
    ...baseEvent,
    triggerSource: 'DefineAuthChallenge_Authentication',
    request: {
      ...baseRequest,
      session: previousSessions ?? [],
      clientMetadata: clientMetadata,
    },
    response: {
      challengeName: '',
      failAuthentication: false,
      issueTokens: false,
    },
  };
};

/**
 * Creates a mock event for Create Auth Challenge.
 */
export const buildCreateAuthChallengeEvent = (
  previousSessions?: ChallengeResult[],
  clientMetadata?: PasswordlessClientMetaData | Record<string, string>,
  userAttributes: Record<string, string> = emailUserAttributes
): CreateAuthChallengeTriggerEvent => {
  return {
    ...baseEvent,
    triggerSource: 'CreateAuthChallenge_Authentication',
    request: {
      challengeName: 'CUSTOM_CHALLENGE',
      session: previousSessions ?? [],
      clientMetadata: clientMetadata,
      userAttributes: userAttributes,
      userNotFound: false,
    },
    response: {
      publicChallengeParameters: {},
      privateChallengeParameters: {},
      challengeMetadata: '',
    },
  };
};

/**
 * Creates a mock event for Verify Auth Challenge Response.
 */
export const buildVerifyAuthChallengeResponseEvent = (
  clientMetadata: PasswordlessClientMetaData | Record<string, string>,
  answer = '',
  privateChallengeParameters = {}
): VerifyAuthChallengeResponseTriggerEvent => {
  return {
    ...baseEvent,
    triggerSource: 'VerifyAuthChallengeResponse_Authentication',
    request: {
      ...baseRequest,
      privateChallengeParameters: privateChallengeParameters,
      challengeAnswer: answer,
      clientMetadata: clientMetadata,
    },
    response: {
      answerCorrect: false,
    },
  };
};