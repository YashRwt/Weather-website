import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import {getHistoricalData,sendToClient} from './services/getHistoricalData'
import { config } from './config/config'
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    //get cities from config
    const cities = config.cities
    const connectionId = event.requestContext.connectionId;
    const payload = JSON.parse(event.body);
    try {
        const city = cities.find(city=>city.name ===payload.city)
        const historicalData = await getHistoricalData(city);
        await sendToClient(connectionId,historicalData)
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
