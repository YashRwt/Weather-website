import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from '@aws-sdk/util-dynamodb';

//Create new DocumentClient

const dynamoClient = new DynamoDBClient({});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    let {connectionId} = event.requestContext;
    console.log("ID:" + connectionId);

    //Parameters for storing connection ID in DynamoDB
    
    try {

        await removeConnectionId(connectionId)
        return {
            statusCode: 200,
            body: 'Disconnected'
        };
    } catch (err) {
        console.log(err);
        return {
            statusCode: 500,
            body: 'Error'
        };
    }
};
const removeConnectionId = async(connectionId)=>{
    const params = {
        TableName: "socket-connections",
        Key: marshall({connectionId})
    };
    const command = new DeleteItemCommand(params)
    return dynamoClient.send(command );
}
