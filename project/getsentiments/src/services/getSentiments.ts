import { ComprehendClient, DetectSentimentCommand } from "@aws-sdk/client-comprehend";
import axios, { AxiosResponse } from 'axios';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { format } from 'date-fns';
import {ScanCommand  ,DynamoDBClient,PutItemCommand} from '@aws-sdk/client-dynamodb'

import { unmarshall } from '@aws-sdk/util-dynamodb';
import { marshall } from "@aws-sdk/util-dynamodb";
//Create new DocumentClient


const client = new DynamoDBClient({});
const comprehendClient = new ComprehendClient( {region:'us-east-1' } );  // replace 'your-region' with your AWS region

export const getSentiments = async (city: string): Promise<{positive: number,negative: number,neutral: number,mixed: number}> => {
    try {
        // Get the news data
        const newsData = await getWeatherData(city);
        if(newsData.articles.length ===0){
            return {positive: 0.25,negative: 0.25,neutral: 0.25,mixed: 0.25}
        }
        let totalPositive = 0
        let totalNegative = 0
        let totalNeutral = 0
        let totalMixed = 0
        let total = 0
        // Loop through the articles
        for (const article of newsData.articles) {
            const title = article.title;
            console.log('Analyzing text:', title);

            // Params for Comprehend sentiment detection
            const params = {
                LanguageCode: 'en',
                Text: title
            };
            
            try {
                // Use Comprehend to analyze the text
                const sentimentResponse = await comprehendClient.send(new DetectSentimentCommand(params));

                // Push the sentiment to the sentimentData array
                
                totalPositive+= sentimentResponse.SentimentScore.Positive
                totalNegative+= sentimentResponse.SentimentScore.Negative
                totalNeutral+= sentimentResponse.SentimentScore.Neutral
                totalMixed+= sentimentResponse.SentimentScore.Mixed
                total++
            } catch (error) {
                console.error("Unable to analyze text. Error:", error);
                return {positive: 0.3,negative: 0.2,neutral: 0.4,mixed: 0.1}
            }
        }
        
        
        return {positive: totalPositive/total,negative: totalNegative/total,neutral: totalNeutral/total,mixed: totalPositive/total};
    } catch (error) {
        console.error("Unable to generate sentiment. Error:", error);
        //dummy data
        return {positive: 0.3,negative: 0.2,neutral: 0.4,mixed: 0.1}
        
    }
};

//gets weather data from api
const getWeatherData = (city: string) => {
    const date = format(new Date(), 'yyyy-MM-dd');
    const date2 = format((new Date()).setDate(new Date().getDate()-1), 'yyyy-MM-dd');
    const url = `https://newsapi.org/v2/everything?q=Weather%20${city}&from=${date}&to=${date2}&sortBy=popularity&apiKey=0e0751f2270e4d71a362750a1187ffab`
    const options: { method: string; url: string } = {
        method: 'GET',
        url,
    };
    return axios(options).then((response: AxiosResponse) => response.data)
};

//send data to all clients
export const sendToAllClients = async(data:{positive: number,negative: number,neutral: number,mixed: number})=>{
    const scanParams = {
        TableName: "socket-connections", 
        
      };
      
      try {
        const scanCommand = new ScanCommand(scanParams);
        const response = await client.send(scanCommand);
        const items = response.Items;
        await Promise.all(items.map((item)=>{
            const {connectionId} = unmarshall(item)
            return sendToClient(connectionId,data)
        }))
          
        
      } catch (error) {
        console.error(error);
      }
}

//sends data to client using connectionId
export const sendToClient = async(connectionId:string, data: {positive: number,negative: number,neutral: number,mixed: number}) => {
    const apiGateway = new ApiGatewayManagementApiClient({
        endpoint: 'https://26b80m2dd8.execute-api.us-east-1.amazonaws.com/production',
    });
    console.log(JSON.stringify(data))
    const params = {
        ConnectionId: connectionId,
        Data: JSON.stringify(data),
    };
    
    try {
        await apiGateway.send(new PostToConnectionCommand(params));
        console.log('Message sent successfully.');
    } catch (error) {
        console.error('Failed to send message:', error);
    }
}
export const putToDynamo = async(item:{city:string,timestamp: string,positive: number,negative: number,neutral: number,mixed: number})=>{
    
    const input = {
        TableName: 'sentiments',

        Item: marshall(item),
    }
    const command = new PutItemCommand(input);
    return client.send(command);
}