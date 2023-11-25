import { SNSClient } from '@aws-sdk/client-sns';
import { ChallengeServiceFactory } from '../factories/challenge_service_factory.js';
import { DeliveryServiceFactory } from '../factories/delivery_service_factory.js';
import { MagicLinkChallengeService } from '../magic-link/magic_link_challenge_service.js';
import { OtpChallengeService } from '../otp/otp_challenge_service.js';
import { SnsService } from '../services/sns_service.js';
import { CustomAuthService } from './custom_auth_service.js';
import { PasswordlessConfig } from '../common/passwordless_config.js';
import { SesService } from '../services/ses_service.js';
import { SESClient } from '@aws-sdk/client-ses';

const { otpConfig, snsConfig, sesConfig } = new PasswordlessConfig(process.env);

const deliveryServiceFactory = new DeliveryServiceFactory([
  new SnsService(new SNSClient(), snsConfig),
  new SesService(new SESClient(), sesConfig),
]);

const otpChallengeService = new OtpChallengeService(
  deliveryServiceFactory,
  otpConfig
);

const challengeServiceFactory = new ChallengeServiceFactory([
  otpChallengeService,
  new MagicLinkChallengeService(),
]);

export const { defineAuthChallenge, createAuthChallenge, verifyAuthChallenge } =
  new CustomAuthService(challengeServiceFactory);
