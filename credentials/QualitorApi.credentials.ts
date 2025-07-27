import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class QualitorApi implements ICredentialType {
	name = 'qualitorApi';
	displayName = 'Qualitor API';
	documentationUrl = 'https://www.qualitor.com.br/docs/8.10.08.20170713/integracao/index.html';

	properties: INodeProperties[] = [
		{
			displayName: 'Qualitor Base URL',
			name: 'baseUrl',
			type: 'string',
			default: '',
			placeholder: 'https://qualitor.example.com/qualitor',
		},

		{
			displayName: 'Company ID',
			name: 'companyId',
			type: 'number',
			default: 1,
			description: 'The ID of the company to which the user belongs',
		},

		{
			displayName: 'Username',
			name: 'username',
			type: 'string',
			default: '',
			description: 'The username for authentication',
		},

		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'The password for authentication',
		},
	];
}
