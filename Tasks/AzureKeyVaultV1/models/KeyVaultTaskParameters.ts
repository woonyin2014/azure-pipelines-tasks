import msRestAzure = require('azure-arm-rest/azure-arm-common');
import tl = require("vsts-task-lib/task");
import util = require("util");

import { AzureEndpoint } from 'azure-arm-rest/azureModels';
import { AzureRMEndpoint } from 'azure-arm-rest/azure-arm-endpoint';

export class KeyVaultTaskParameters {

    public subscriptionId: string;
    public keyVaultName: string;
    public secretsFilter: string[];
    public vaultCredentials: msRestAzure.ApplicationTokenCredentials;
    public keyVaultUrl: string;
    public servicePrincipalId: string;
    public scheme: string;

    private _environments = {
        'AzureStack': 'azurestack'
    }

    public async getKeyVaultTaskParameters() : Promise<KeyVaultTaskParameters> {
        var connectedService = tl.getInput("ConnectedServiceName", true);
        this.subscriptionId = tl.getEndpointDataParameter(connectedService, "SubscriptionId", true);
        this.keyVaultName = tl.getInput("KeyVaultName", true);
        this.secretsFilter = tl.getDelimitedInput("SecretsFilter", ",", true);
        var azureKeyVaultDnsSuffix = tl.getEndpointDataParameter(connectedService, "AzureKeyVaultDnsSuffix", true);
        this.servicePrincipalId = tl.getEndpointAuthorizationParameter(connectedService, 'serviceprincipalid', true);
        this.keyVaultUrl = util.format("https://%s.%s", this.keyVaultName, azureKeyVaultDnsSuffix);
        this.scheme = tl.getEndpointAuthorizationScheme(connectedService, false);
        this.vaultCredentials = await this.getVaultCredentials(connectedService, azureKeyVaultDnsSuffix);
        return this;
    }

    private async getVaultCredentials(connectedService: string, azureKeyVaultDnsSuffix: string): Promise<msRestAzure.ApplicationTokenCredentials> {
        const endpoint: AzureEndpoint = await new AzureRMEndpoint(connectedService).getEndpoint();
         
        if(!!endpoint.environment && endpoint.environment.toLowerCase() == this._environments.AzureStack) {
            endpoint.applicationTokenCredentials.activeDirectoryResourceId = endpoint.activeDirectoryResourceID.replace("management", "vault");
        } else {
            endpoint.applicationTokenCredentials.baseUrl = endpoint.azureKeyVaultServiceEndpointResourceId;
            endpoint.applicationTokenCredentials.activeDirectoryResourceId = endpoint.azureKeyVaultServiceEndpointResourceId;
        }

        return endpoint.applicationTokenCredentials;
    }
}