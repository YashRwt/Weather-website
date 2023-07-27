import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import {getPredictions} from './services/getPredictions'
import {getHistoricalData,sendToClient,putToDynamo, sendToAllClients} from './services/getHistoricalData'
import { config } from './config/config'
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    //get cities from config
    const cities = config.cities
    const connectionId = event.requestContext.connectionId;
    const payload = JSON.parse(event.body);
    try {
        const city = cities.find(city=>city.name ===payload.city)
        const historicalData = await getHistoricalData(city);
        const predictions = await getPredictions(historicalData,city)
        await sendToAllClients({historicalData,predictions,city:payload.city})
        await putToDynamo(predictions,payload.city);
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
