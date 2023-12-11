import { VerifyAuthChallengeResponseTriggerEvent } from 'aws-lambda';
import { match, notStrictEqual, rejects, strictEqual } from 'node:assert';
import { beforeEach, describe, it, mock } from 'node:test';
import { DeliveryServiceFactory } from '../factories/delivery_service_factory.js';
import { CustomChallengeResult } from 'aws-lambda/trigger/cognito-user-pool-trigger/_common.js';
import {
  buildCreateAuthChallengeEvent,
  buildVerifyAuthChallengeResponseEvent,
  confirmOtpMetaData,
  phoneUserAttributes,
  requestOtpSmsMetaData,
} from '../mocks/challenge_events.mock.js';
import {
  DeliveryMedium,
  DeliveryService,
  OtpConfig,
  PasswordlessErrorCodes,
} from '../types.js';
import { OtpChallengeService } from './otp_challenge_service.js';

/**
 * A mock SnsService
 */
class MockDeliveryService implements DeliveryService {
  constructor(public deliveryMedium: DeliveryMedium) {}
  send = async (): Promise<void> => Promise.resolve();
}

const initialSession: CustomChallengeResult = {
  challengeName: 'CUSTOM_CHALLENGE',
  challengeResult: false,
  challengeMetadata: 'PROVIDE_AUTH_PARAMETERS',
};

void describe('OTP Challenge', () => {
  const mockOtpCode = '123456';
  let otpChallenge: OtpChallengeService;
  let mockSmsService: MockDeliveryService;
  let mockEmailService: MockDeliveryService;

  void beforeEach(() => {
    mockSmsService = new MockDeliveryService('SMS');
    mockEmailService = new MockDeliveryService('EMAIL');

    const otpConfig: OtpConfig = {
      otpLength: 6,
    };

    const deliveryServiceFactory: DeliveryServiceFactory = {
      getService: (deliveryMedium: DeliveryMedium) =>
        deliveryMedium === 'SMS' ? mockSmsService : mockEmailService,
    };

    otpChallenge = new OtpChallengeService(deliveryServiceFactory, otpConfig);
  });

  void describe('validateVerifyEvent()', () => {
    void it('should throw an error if OTP code is not in privateChallengeParameters', async () => {
      const event: VerifyAuthChallengeResponseTriggerEvent =
        buildVerifyAuthChallengeResponseEvent(confirmOtpMetaData, '123456');

      await rejects(
        async () => otpChallenge.verifyChallenge(event),
        Error('OTP code not found in privateChallengeParameters')
      );
    });
  });

  void describe('createChallenge()', () => {
    void it('should send and attach sms delivery details', async () => {
      const smsRequestCreateChallengeEvent = buildCreateAuthChallengeEvent(
        [initialSession],
        requestOtpSmsMetaData,
        phoneUserAttributes
      );
      const expectedPhoneNumber = '+15555555555';
      const expectedOtpLength = 6;

      const sendMock = mock.method(
        mockSmsService,
        'send',
        // parameters are required to check that the method was called with the
        // correct arguments.
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (_param: string, _param2: string) => {
          return;
        }
      );

      strictEqual(sendMock.mock.callCount(), 0);

      const result = await otpChallenge.createChallenge(
        { deliveryMedium: 'SMS', attributeName: 'phone_number' },
        expectedPhoneNumber,
        smsRequestCreateChallengeEvent
      );

      strictEqual(sendMock.mock.callCount(), 1);

      const secret = sendMock.mock.calls[0].arguments[0] ?? '';
      const actualPhoneNumber = sendMock.mock.calls[0].arguments[1];

      match(secret, /[0-9]{5}/);

      strictEqual(actualPhoneNumber, expectedPhoneNumber);

      // Assert that the public and private challenge parameters are set
      strictEqual(
        result.response.publicChallengeParameters.deliveryMedium,
        'SMS'
      );
      strictEqual(
        result.response.publicChallengeParameters['nextStep'],
        'PROVIDE_CHALLENGE_RESPONSE'
      );
      const actualCode = result.response.privateChallengeParameters.otpCode;
      strictEqual(actualCode.length, expectedOtpLength);
      // code is string of numbers
      notStrictEqual(actualCode.match(/^\d+$/), null);
      strictEqual(
        result.response.privateChallengeParameters.errorCode,
        undefined
      );
    });
    void it('should retrieve previous code when present in event', async () => {
      const previousOtpCode = '123456';
      const previousDeliveryMedium = 'SMS';
      const previousChallengeMetadata = JSON.stringify({
        OTP_CODE: previousOtpCode,
        deliveryMedium: previousDeliveryMedium,
      });
      const previousSessions: CustomChallengeResult[] = [
        initialSession,
        {
          challengeName: 'CUSTOM_CHALLENGE',
          challengeResult: false,
          challengeMetadata: previousChallengeMetadata,
        },
      ];
      const retrySmsRequestCreateChallengeEvent = buildCreateAuthChallengeEvent(
        previousSessions,
        requestOtpSmsMetaData,
        phoneUserAttributes
      );
      const expectedPhoneNumber = '+15555555555';

      const sendMock = mock.method(mockSmsService, 'send', () => {
        return;
      });

      strictEqual(sendMock.mock.callCount(), 0);

      const result = await otpChallenge.createChallenge(
        { deliveryMedium: 'SMS', attributeName: 'phone_number' },
        expectedPhoneNumber,
        retrySmsRequestCreateChallengeEvent
      );

      // Assert that a message was not sent
      strictEqual(sendMock.mock.callCount(), 0);

      strictEqual(
        result.response.challengeMetadata.includes(previousChallengeMetadata),
        true
      );
      strictEqual(
        result.response.publicChallengeParameters.deliveryMedium,
        previousDeliveryMedium
      );
      strictEqual(
        result.response.privateChallengeParameters.otpCode,
        previousOtpCode
      );
      strictEqual(
        result.response.publicChallengeParameters.errorCode,
        PasswordlessErrorCodes.CODE_MISMATCH_EXCEPTION
      );
    });
  });

  void describe('verifyChallenge()', () => {
    const smsConfirmVerifyChallengeEvent =
      buildVerifyAuthChallengeResponseEvent(confirmOtpMetaData, mockOtpCode, {
        otpCode: mockOtpCode,
      });
    void it('should return answerCorrect: true when the OTP code is correct', async () => {
      const result = await otpChallenge.verifyChallenge(
        smsConfirmVerifyChallengeEvent
      );

      strictEqual(result.response.answerCorrect, true);
    });

    void it('should return answerCorrect: false when the OTP code wrong', async () => {
      smsConfirmVerifyChallengeEvent.request.challengeAnswer = '567890';

      const result = await otpChallenge.verifyChallenge(
        smsConfirmVerifyChallengeEvent
      );

      strictEqual(result.response.answerCorrect, false);
    });
  });
});
