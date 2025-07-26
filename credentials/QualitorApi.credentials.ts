import { ICredentialType, INodeProperties } from "n8n-workflow";

export class QualitorApi implements ICredentialType { 
  name = 'qualitorApi';
  displayName = 'Qualitor API';
  documentationUrl = '';

  properties: INodeProperties[] = [
    {
      displayName: 'WSDL URL',
      name: 'wsdlUrl',
      type: 'string',
      default: 'https://qualitor.example.com/ws/services/Ticket/WSTicket.wsdl',
    },

    {
      displayName: 'Company ID',
      name: 'companyId',
      type: 'number',
      default: 1,
      description: 'The ID of the company to which the tickets belong',
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
};