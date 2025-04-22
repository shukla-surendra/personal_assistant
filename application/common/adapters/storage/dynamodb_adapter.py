from .base import StorageAdapter
from boto3.dynamodb.conditions import Key, Attr
import boto3
from config import get_config
from typing import Dict, Optional

class DynamoDBAdapter(StorageAdapter):
    def __init__(self):
        self.config = get_config()
        self.dynamodb = boto3.resource('dynamodb', region_name=self.config.aws_region)
        
    def _get_table(self, table_name: str):
        return self.dynamodb.Table(table_name)

    def create_user(self, user_data: Dict) -> Dict:
        table = self._get_table('users')
        table.put_item(Item=user_data)
        return user_data

    def get_user_by_id(self, user_id: str) -> Optional[Dict]:
        table = self._get_table('users')
        response = table.get_item(Key={'user_id': user_id})
        return response.get('Item')

    # ... implement other methods 