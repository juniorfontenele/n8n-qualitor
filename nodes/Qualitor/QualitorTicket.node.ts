import { 
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeConnectionType,
} from "n8n-workflow";

import * as qs from "qs";

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
            name: 'Get Ticket',
            value: 'getTicket',
            description: 'Get ticket from Qualitor',
          },
        ],
        default: 'getTicket',
      },

      {
        displayName: 'Filters',
        name: 'filters',
        type: 'collection',
        placeholder: 'Add Filter',
        default: {},
        displayOptions: {
          show: {
            operation: ['getTicket'],
          },
        },
        options: [
          {
            displayName: 'cdchamado',
            name: 'cdchamado',
            type: 'number',
            default: null,
            placeholder: '12345',
          },
          {
            displayName: 'cdsituacao',
            name: 'cdsituacao',
            type: 'number',
            default: null,
            placeholder: '12345',
          },
          {
            displayName: 'cdcliente',
            name: 'cdcliente',
            type: 'number',
            default: null,
            placeholder: '12345',
          },
          {
            displayName: 'cdcategoria',
            name: 'cdcategoria',
            type: 'number',
            default: null,
            placeholder: '12345',
          },
        ],
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> { 
    const items = this.getInputData();
    const credentials = await this.getCredentials('qualitorApi');
    const { wsdlUrl, companyId, username, password } = credentials as IDataObject;

    const query: Record<string, string> = {
      user: username as string,
      password: password as string,
      company: companyId as string,
      wsdl_file: 'wsticket.wsdl',
    };

    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) { 
      const operation = this.getNodeParameter('operation', i) as string;

      let response;

      if (operation === 'getTicket') {
        let filterObj = this.getNodeParameter('filters', i, {});

        if (Object.keys(filterObj).length > 0) {
          const filtersString = Object.entries(filterObj)
            .map(([key, value]) => `<${key}>${value}</${key}>`)
            .join('');
          
          const xml = `
            <wsqualitor>
              <contents>
                <data>
                ${filtersString}
                </data>
              </contents>
            </wsqualitor>
          `.trim();

          console.log('XML Request:', xml);

          query.input_xml = xml;
        }

        const queryString = qs.stringify({
          ...query,
          operation: 'getTicket',
        });

        response = await this.helpers.httpRequest.call(this, {
          method: 'POST',
          url: `${wsdlUrl}?${queryString}`,
        });

        console.log('Get All Tickets Response:', response);

        returnData.push({
          json: {
            data: response || undefined,
          },
        });
      };
      
    };

    return this.prepareOutputData(returnData);
  };
 };