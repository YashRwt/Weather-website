import axios, { AxiosResponse } from 'axios';
import {PutItemCommand ,DynamoDBClient} from '@aws-sdk/client-dynamodb'
import { marshall } from "@aws-sdk/util-dynamodb";
const client = new DynamoDBClient({});

import { config } from '../config/config'
export const saveWeatherData = async() => {
    //get countries from config
    const cities = config.cities

    for (const city of cities){
        //get weather data
        const data:WeatherReponse = await getWeatherData(city.longitude,city.latitude)

        //insert data into db
        for (let i=0;i<data.hourly.time.length;i=i+12){
            let status = 0
            while (status === 0){
            try{
                await putToDynamo({
                    id: `${city.name}:${data.hourly.time[i]}`,
                    longitude:data.longitude,
                    latitude:data.latitude,
                    elevation : data.elevation,
                    temperature: data.hourly.temperature_2m[i]
                })
                status = 1
            }
            catch(e){
                await sleep(1000)
                
            }
            }
        }
        

    }

}
    

const getWeatherData =  (longitude: number,latitude:number) => {
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=2022-06-29&end_date=2023-06-29&hourly=temperature_2m`
    const options: { method: string; url: any } = {
        method: 'GET',
        url,
    };
    return axios(options).then((response:AxiosResponse) =>response.data)
}
const putToDynamo = async(item:{id:string,longitude: number,latitude:number,elevation:number,temperature:number})=>{
    
    const input = {
        TableName: 'weather',

        Item: marshall(item),
    }
    const command = new PutItemCommand(input);
    return client.send(command);
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
const sleep = (ms:number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}