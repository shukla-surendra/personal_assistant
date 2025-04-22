import boto3
import jwt
from .base import AuthAdapter
from config import get_config
from fastapi import HTTPException, status
from typing import Dict
from ..base_factory import BaseAdapterFactory

class CognitoAdapter(AuthAdapter):
    def __init__(self, factory: BaseAdapterFactory):
        self.config = get_config()
        self.cognito = boto3.client(
            'cognito-idp',
            region_name=self.config.aws_region or 'ap-south-1'  # Default to ap-south-1 if not set
        )
        self.factory = factory
        
    def register_user(self, email: str, password: str, attributes: dict) -> str:
        response = self.cognito.sign_up(
            ClientId=self.config.cognito_client_id,
            Username=email,
            Password=password,
            UserAttributes=[
                {'Name': key, 'Value': value}
                for key, value in attributes.items()
            ]
        )
        return response['UserSub']

    def authenticate(self, email: str, password: str) -> Dict:
        try:
            response = self.cognito.initiate_auth(
                ClientId=self.config.cognito_client_id,
                AuthFlow='USER_PASSWORD_AUTH',
                AuthParameters={
                    'USERNAME': email,
                    'PASSWORD': password
                }
            )
            
            # Get user info
            user_info = self.cognito.get_user(
                AccessToken=response['AuthenticationResult']['AccessToken']
            )
            
            return {
                'access_token': response['AuthenticationResult']['AccessToken'],
                'id_token': response['AuthenticationResult']['IdToken'],
                'refresh_token': response['AuthenticationResult']['RefreshToken'],
                'user_attributes': {
                    attr['Name']: attr['Value']
                    for attr in user_info['UserAttributes']
                }
            }
        except self.cognito.exceptions.NotAuthorizedException:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        except self.cognito.exceptions.UserNotConfirmedException:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email not verified"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Authentication failed: {str(e)}"
            )

    def verify_token(self, token: str) -> Dict:
        try:
            # Get the public key from Cognito
            jwks_url = f"https://cognito-idp.{self.config.aws_region or 'ap-south-1'}.amazonaws.com/{self.config.cognito_user_pool_id}/.well-known/jwks.json"
            jwks_client = jwt.PyJWKClient(jwks_url)
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            
            # Verify the token
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                audience=self.config.cognito_client_id,
                issuer=f"https://cognito-idp.{self.config.aws_region or 'ap-south-1'}.amazonaws.com/{self.config.cognito_user_pool_id}"
            )
            
            return {
                'sub': payload['sub'],
                'email': payload['email'],
                'email_verified': payload.get('email_verified', False),
                'token_use': payload['token_use'],
                'exp': payload['exp']
            }
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.InvalidTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Token verification failed: {str(e)}"
            )

    # ... implement other methods 