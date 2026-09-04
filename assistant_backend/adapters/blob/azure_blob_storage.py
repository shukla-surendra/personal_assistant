from azure.storage.blob import BlobServiceClient, ContentSettings, PublicAccess
from azure.core.exceptions import ResourceExistsError
from azure.identity import DefaultAzureCredential
from config import get_config, logger

config = get_config()


class AzureBlobStorage:
    """Avatar storage. Prod (AKS) authenticates via Workload Identity
    (DefaultAzureCredential picks up the env vars the Workload Identity
    webhook injects -- no stored secret); local dev points the same SDK at
    Azurite via AZURE_STORAGE_CONNECTION_STRING instead. Azurite implements
    the real Blob REST API, so this is one code path, not two."""

    def __init__(self):
        if config.AZURE_STORAGE_CONNECTION_STRING:
            self.client = BlobServiceClient.from_connection_string(
                config.AZURE_STORAGE_CONNECTION_STRING
            )
            self.public_base_url = (
                config.AZURE_STORAGE_PUBLIC_BASE_URL
                or self.client.url.rstrip("/")
            )
        else:
            self.client = BlobServiceClient(
                account_url=config.AZURE_STORAGE_ACCOUNT_URL,
                credential=DefaultAzureCredential(),
            )
            self.public_base_url = (
                config.AZURE_STORAGE_PUBLIC_BASE_URL
                or config.AZURE_STORAGE_ACCOUNT_URL.rstrip("/")
            )

        self.container_name = config.AZURE_STORAGE_CONTAINER
        self._ensure_container()

    def _ensure_container(self):
        """Idempotent -- Azurite starts with no containers at all, and a
        freshly-provisioned Azure storage account has none either until this
        runs once. public_access=BLOB: anonymous read on blob contents, no
        container listing -- avatars are non-sensitive but shouldn't be
        enumerable."""
        try:
            self.client.create_container(self.container_name, public_access=PublicAccess.Blob)
        except ResourceExistsError:
            pass

    def upload_avatar(self, user_id: str, content: bytes, content_type: str) -> str:
        """Fixed blob name per user (no extension) with overwrite=True --
        re-uploading replaces the same blob in place, so there's never an
        orphaned old file left behind and the returned URL never changes."""
        blob_client = self.client.get_blob_client(container=self.container_name, blob=str(user_id))
        blob_client.upload_blob(
            content,
            overwrite=True,
            content_settings=ContentSettings(content_type=content_type),
        )
        logger.info(f"Uploaded avatar for user {user_id}")
        return f"{self.public_base_url}/{self.container_name}/{user_id}"
