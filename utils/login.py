import os
import logging
import json
import boto3
from random import randint

boto3.setup_default_session(region_name='us-east-1')
lambda_client = boto3.client('lambda')
logger = logging.getLogger(__name__)


async def send_otp_email(user):
    # generate a 6-digit OTP
    otp = randint(100000, 999999)

    try:
        payload = dict()
        payload["payload"] = dict(action="login_email_otp_request",  recipient_email=user.email)
        lambda_client.invoke(
            FunctionName=os.getenv("emailer_service_arn"),
            InvocationType='Event',
            Payload=json.dumps(payload)
        )
    except Exception as exc:
        logger.error(f"Error in sending email, {exc}")
    return otp
