import axios, { AxiosResponse } from 'axios';
import {ScanCommand  ,DynamoDBClient,PutItemCommand} from '@aws-sdk/client-dynamodb'
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { format } from 'date-fns';
import { unmarshall,marshall } from '@aws-sdk/util-dynamodb';

//Create new DocumentClient


const client = new DynamoDBClient({});


export const getHistoricalData = async (city:{longitude:number,latitude:number}):Promise<{date:string,temperature:number}[]> => {
    

    
    
    const date = new Date();
    date.setDate(date.getDate() - 7)
    const date2 = new Date()
    date2.setDate(date2.getDate() - 10)
    
    
    const end = format(date, 'yyyy-MM-dd');
    const start = format(date2, 'yyyy-MM-dd');
    console.log('start Date:'+start)
    const data:WeatherReponse = await getWeatherData(city.longitude,city.latitude,start,end)

    const historicalData =[]
    
    
    for(let i=0;i<data.hourly.time.length; i++)
    {
        historicalData.push({date:format(new Date(data.hourly.time[i]), 'yyyy-MM-dd HH:mm:ss'),temperature:data.hourly.temperature_2m[i]})
        
    }
    console.log('historical data:'+ JSON.stringify(historicalData))
    return historicalData
        

    

}
    
//gets weather data from meteo api
const getWeatherData =  (longitude: number,latitude:number,startDate:string,endDate:string) => {
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${startDate}&end_date=${endDate}&hourly=temperature_2m`
    const options: { method: string; url: any } = {
        method: 'GET',
        url,
    };
    return axios(options).then((response:AxiosResponse) =>response.data)
}


//send data to all clients
export const sendToAllClients = async(data:{historicalData:{date:string,temperature:number}[],predictions:{date:string,temperature:number}[],city:string})=>{
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

export const sendToClient = async(connectionId:string,data:{historicalData:{date:string,temperature:number}[],predictions:{date:string,temperature:number}[]})=>{
    const apiGateway = new ApiGatewayManagementApiClient({
        
        endpoint: 'https://26b80m2dd8.execute-api.us-east-1.amazonaws.com/production',
    });
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
export const putToDynamo = async(items:{date:string,temperature:number}[],city:string)=>{
    for (const item of items){
        const input = {
            TableName: 'predictions',

            Item: marshall({...item,city}),
        }
        const command = new PutItemCommand(input);
        await client.send(command);
    }
}

type WeatherReponse ={
    latitude:number;
    longitude:number;
    elevation: number;
    hourly:{
        time:string[];
        temperature_2m:number[];
    }

}