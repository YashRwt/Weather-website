import axios, { AxiosResponse } from 'axios';
import {PutItemCommand ,DynamoDBClient} from '@aws-sdk/client-dynamodb'
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { format } from 'date-fns';


const client = new DynamoDBClient({});


export const getHistoricalData = async (city:{longitude:number,latitude:number}):Promise<{date:string,temperature:number}[]> => {
    

    
    
    const date = new Date();
    date.setDate(date.getDate() - 7)
    const date2 = new Date()
    date2.setDate(date2.getDate() - 10)
    
    /*
    const startDay = yesterday.getDay().toString().length > 1 ?  yesterday.getDay().toString() : '0'+yesterday.getDay().toString()
    const startMonth = yesterday.getMonth().toString().length > 1 ?  yesterday.getMonth().toString() : '0'+yesterday.getMonth().toString()
    const start = `${yesterday.getFullYear()}-${startMonth}-${startDay}`

    const endDay = date.getDay().toString().length > 1 ?  date.getDay().toString() : '0'+date.getDay().toString()
    const endMonth = date.getMonth().toString().length > 1 ?  date.getMonth().toString() : '0'+date.getMonth().toString()
    const end = `${date.getFullYear()}-${endMonth}-${endDay}`
    //get weather data
    */
    const end = format(date, 'yyyy-MM-dd');
    const start = format(date2, 'yyyy-MM-dd');
    console.log('start Date:'+start)
    const data:WeatherReponse = await getWeatherData(city.longitude,city.latitude,start,end)

    const historicalData =[]
    //insert data into db
    
    for(let i=0;i<data.hourly.time.length; i++)
    {
        historicalData.push({date:format(new Date(data.hourly.time[i]), 'yyyy-MM-dd HH:mm:ss'),temperature:data.hourly.temperature_2m[i]})
        
    }
    console.log('historical data:'+ JSON.stringify(historicalData))
    return historicalData
        

    

}
    

const getWeatherData =  (longitude: number,latitude:number,startDate:string,endDate:string) => {
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${startDate}&end_date=${endDate}&hourly=temperature_2m`
    const options: { method: string; url: any } = {
        method: 'GET',
        url,
    };
    return axios(options).then((response:AxiosResponse) =>response.data)
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

export const sendToClient = async(connectionId:string,data:any)=>{
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