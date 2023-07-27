import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from '@aws-sdk/util-dynamodb';

//Create new DocumentClient

const dynamoClient = new DynamoDBClient({});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    let {connectionId} = event.requestContext;
    console.log("ID:" + connectionId);

    //Parameters for storing connection ID in DynamoDB
    
    try {

        await addConnectionId(connectionId)
        return {
            statusCode: 200,
            body: 'Connected'
        };
    } catch (err) {
        console.log(err);
        return {
            statusCode: 500,
            body: 'Error'
        };
    }
};
const addConnectionId = async(connectionId)=>{
    const params = {
        TableName: "socket-connections",
        Item: marshall({connectionId})
    };
    const command = new PutItemCommand(params)
    return dynamoClient.send(command );
}
