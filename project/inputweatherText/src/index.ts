import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {saveWeatherTextData} from './services/saveWeatherTextData'

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        await saveWeatherTextData();
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
