import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';

import * as qs from 'qs';

import * as xml2js from 'xml2js';

export class Qualitor implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Qualitor SOAP API',
		name: 'qualitor',
		group: ['transform'],
		version: 1,
		description: 'Consume Qualitor SOAP Webservices',
		defaults: {
			name: 'Qualitor SOAP API',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'qualitorApi',
				required: true,
			},
		],

		properties: [
			{
				displayName: 'Service',
				name: 'service',
				type: 'options',
				noDataExpression: true,
				required: true,
				options: [
					{
						name: 'General',
						value: 'wsgeneral.wsdl',
						description: 'General Webservices',
					},
					{
						name: 'Ticket',
						value: 'wsticket.wsdl',
						description: 'Ticket Webservices',
					},
					{
						name: 'Service',
						value: 'wsservice.wsdl',
						description: 'Service Webservices',
					},
				],
				default: 'wsticket.wsdl',
			},

			{
				displayName: 'Operation',
				name: 'operation',
				type: 'string',
				noDataExpression: true,
				required: true,
				default: '',
				placeholder: 'getTicket',
			},

			{
				displayName: 'Parse Response?',
				name: 'parseResponse',
				type: 'boolean',
				default: true,
				description: 'Whether to parse the response as JSON or return raw XML',
			},

			{
				displayName: 'Fields',
				name: 'fields',
				type: 'fixedCollection',
				default: {},
				typeOptions: {
					multipleValues: true,
				},
				options: [
					{
						displayName: 'Field',
						name: 'field',
						values: [
							{
								displayName: 'Field Name',
								name: 'key',
								type: 'string',
								default: '',
								placeholder: 'cdchamado',
							},
							{
								displayName: 'Field Value',
								name: 'value',
								type: 'string',
								default: '',
								placeholder: '123',
							},
						],
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const credentials = await this.getCredentials('qualitorApi');
		const { baseUrl, companyId, username, password } = credentials as IDataObject;

		const query: Record<string, string> = {
			user: username as string,
			password: password as string,
			company: companyId as string,
		};

		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const service = this.getNodeParameter('service', i) as string;
			const operation = this.getNodeParameter('operation', i) as string;
			const parseResponse = this.getNodeParameter('parseResponse', i, true) as boolean;

			query.wsdl_file = service;
			query.operation = operation;

			let response;

			let filterObj = this.getNodeParameter('fields.field', i, []) as Array<{
				key: string;
				value: string;
			}>;

			if (filterObj.length > 0) {
				const filtersString = filterObj
					.map(({ key, value }) => `<${key}>${value}</${key}>`)
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

				query.input_xml = xml;
			}

			const queryString = qs.stringify(query);

			response = await this.helpers.httpRequest.call(this, {
				method: 'POST',
				url: `${baseUrl}/ws/statelessws.php?${queryString}`,
			});

			const parsedResponse = (await xml2js.parseStringPromise(response)) || [];

			returnData.push({
				json: {
					data: parseResponse ? parsedResponse : response || undefined,
				},
			});
		}

		return this.prepareOutputData(returnData);
	}
}
