import { 
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeConnectionType,
} from "n8n-workflow";

import * as soap from 'soap';

export class QualitorTicket implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Qualitor Ticket',
    name: 'qualitorTicket',
    group: ['transform'],
    version: 1,
    description: 'Consume Qualitor Ticket SOAP Webservices',
    defaults: {
      name: 'Qualitor Ticket',
    },
    inputs: [NodeConnectionType.Main],
    outputs: [NodeConnectionType.Main],
    credentials: [
      {
        name: 'qualitorApi',
        required: true,
      }
    ],

    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        required: true,
        options: [
          {
            name: 'Get All Tickets',
            value: 'getAllTickets',
            description: 'Get all tickets from Qualitor',
          },
          {
            name: 'Get Ticket by ID',
            value: 'getTicketById',
            description: 'Get a ticket by its ID',
          },
          {
            name: 'Update Ticket by ID',
            value: 'updateTicketById',
            description: 'Update a ticket by its ID',
          },
        ],
        default: 'getAllTickets',
      },

      {
        displayName: 'Ticket ID',
        name: 'ticketId',
        type: 'string',
        default: '',
        placeholder: '12345',
        description: 'ID of the ticket to retrieve or update',
        displayOptions: {
          show: {
            operation: ['getTicketById', 'updateTicketById'],
          },
        },
      },

      {
        displayName: 'Filters (JSON)',
        name: 'filters',
        type: 'json',
        default: '{}',
        placeholder: '{"cdsituacao": 2}',
        description: 'JSON object containing filters for retrieving tickets',
        displayOptions: {
          show: {
            operation: ['getAllTickets'],
          },
        },
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> { 
    const items = this.getInputData();
    const credentials = await this.getCredentials('qualitorApi');
    const { wsdlUrl, companyId, username, password } = credentials as IDataObject;

    const client = await soap.createClientAsync(wsdlUrl as string);

    client.on('request', (xml) => {
  console.log('SOAP XML enviado:', xml);
});

    const [loginResponse] = await client.loginAsync({
      login: username,
      passwd: password,
      company: companyId,
    });

    const rawToken = loginResponse?.result?.$value;
    const authToken = typeof rawToken === 'string' ? rawToken.trim() : '';

    console.log('AuthToken extraído:', JSON.stringify(authToken));
    console.dir(loginResponse, { depth: null });

    if (!authToken) throw new Error('Authentication failed. Please check your credentials.');

    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) { 
      const operation = this.getNodeParameter('operation', i) as string;

      let response;

      if (operation === 'getAllTickets') {
        const filterObj = this.getNodeParameter('filters', i, {});

        console.log('Filters:', filterObj);

        // const xmlFilters = Object.keys(filterObj).length > 0
        //   ? Object.entries(filterObj).map(
        //       ([key, value]) => `<${key}>${value}</${key}>`
        //     ).join('')
        //   : '';

        const xmlValue = `
<wsqualitor>
  <contents>
    <data>
      <cdchamado>2</cdchamado>
    </data>
  </contents>
</wsqualitor>
`.trim();
        
        console.log('XML Value for Get All Tickets:', xmlValue);

        [response] = await client.getTicketAsync({
          auth: '$1$undL1M9J$hrxPmaQ8CW5X4CXfTtsTg0',
          xmlValue,
        });

        console.log('Get All Tickets Response:', response);
        
        returnData.push({
          json: {
            result: response?.result || response,
          },
        });
      };
      
    };

    return this.prepareOutputData(returnData);
  };
 };