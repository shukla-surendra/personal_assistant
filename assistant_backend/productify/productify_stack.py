from aws_cdk import (
    aws_iam as iam,
    Stack,
    aws_lambda as _lambda, Duration,
)
from aws_cdk.aws_ecr_assets import Platform
from aws_cdk.aws_lambda import FunctionUrlAuthType
from constructs import Construct


class ProductifyStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        lambda_execution_role = iam.Role(self, "ProductifyLambdaRole", role_name="ProductifyLambdaRole",
                                         assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"))
        lambda_execution_role.add_to_policy(
            iam.PolicyStatement(actions=["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
                                resources=["arn:aws:logs:*:*:*"]))
        lambda_execution_role.add_to_policy(
            iam.PolicyStatement(actions=["lambda:InvokeFunction"],
                                resources=["*"]))
        task_lambda = _lambda.DockerImageFunction(self, "TaskLambda", function_name="task-lambda",
                                                  memory_size=2048,
                                                  timeout=Duration.seconds(120),
                                                  code=_lambda.DockerImageCode.from_image_asset("app_code",
                                                                                                platform=Platform.LINUX_AMD64,
                                                                                                file="task_lambda.dockerfile"),
                                                  role=lambda_execution_role)
        task_lambda.add_function_url(auth_type=FunctionUrlAuthType.NONE)

        _lambda.DockerImageFunction(self, "AsyncLambda", function_name="notification-lambda",
                                    memory_size=2048,
                                    timeout=Duration.seconds(120),
                                    code=_lambda.DockerImageCode.from_image_asset("app_code",
                                                                                  platform=Platform.LINUX_AMD64,
                                                                                  file="async_process_lambda.dockerfile"),
                                    role=lambda_execution_role)
