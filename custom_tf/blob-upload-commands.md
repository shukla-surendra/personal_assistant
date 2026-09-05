# Uploading files to the storage account (`custom_tf/infra`)

Resource created by Terraform: `azurerm_storage_account.this`, name
`customtflearning001`, in resource group `custom-tf-learning-rg`
(`terraform output storage_account_name` / `storage_account_id` from
`custom_tf/infra`).

Two ways to upload — Option A works immediately with zero extra setup;
Option B is the "correct" way but needs one extra role assignment first.

## Option A — account key (works right now)

```bash
# Fetch the account's own key (works because shared_access_key_enabled
# defaults to true -- Terraform didn't disable it)
ACCOUNT_KEY=$(az storage account keys list \
  --account-name customtflearning001 \
  --resource-group custom-tf-learning-rg \
  --query "[0].value" -o tsv)

# Containers hold blobs -- a storage account can have many; create one
az storage container create \
  --account-name customtflearning001 \
  --account-key "$ACCOUNT_KEY" \
  --name mycontainer

# Upload a file
az storage blob upload \
  --account-name customtflearning001 \
  --account-key "$ACCOUNT_KEY" \
  --container-name mycontainer \
  --name test.txt \
  --file /path/to/your/local/file.txt

# Confirm it landed
az storage blob list \
  --account-name customtflearning001 \
  --account-key "$ACCOUNT_KEY" \
  --container-name mycontainer \
  --output table
```

## Option B — Azure AD auth, no keys (one extra step)

Being subscription Owner does **not** automatically grant blob data
access -- that's a separate `DataActions` permission, distinct from the
management-plane `Actions` Owner already has. Needs an explicit role
assignment first:

```bash
# One-time: grant your own signed-in identity data-plane access to this account
az role assignment create \
  --assignee "$(az ad signed-in-user show --query id -o tsv)" \
  --role "Storage Blob Data Contributor" \
  --scope "/subscriptions/1f7b45cd-c3f3-487c-8cc6-8eeb3d1ce432/resourceGroups/custom-tf-learning-rg/providers/Microsoft.Storage/storageAccounts/customtflearning001"

# Then no key needed anywhere
az storage container create --account-name customtflearning001 --name mycontainer --auth-mode login
az storage blob upload --account-name customtflearning001 --container-name mycontainer --name test.txt --file /path/to/your/local/file.txt --auth-mode login
```

Same role (`Storage Blob Data Contributor`), same mental model as the
backend's Workload Identity in the main `terraform/` project
(`terraform/keyvault/main.tf`) -- just granted to a person instead of an
app identity.
