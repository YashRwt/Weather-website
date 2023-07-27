import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import {getSentiments, sendToClient,putToDynamo} from './services/getSentiments'

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const connectionId = event.requestContext.connectionId;
    const payload = JSON.parse(event.body);

    try {
        const sentimentData = await getSentiments(payload.city);
        await putToDynamo({city:payload.city,  timestamp:new Date().toISOString(),...sentimentData})
        await sendToClient(connectionId, sentimentData)

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'done',
            }),
        };
    } catch (err) {
        console.log(err);

        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'some error happened',
            }),
        };
    }
};
