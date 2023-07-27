import axios, { AxiosResponse } from 'axios';
import {PutItemCommand ,DynamoDBClient} from '@aws-sdk/client-dynamodb'
import { marshall } from "@aws-sdk/util-dynamodb";
const client = new DynamoDBClient({});

import { config } from '../config/config'
export const saveWeatherTextData = async() => {
    //get countries from config
    const cities = config.cities

    for (const city of cities){
        //get weather data
        const data:WeatherReponse = await getWeatherData(city.name)

        //insert data into db
        for (let i=0;i<data.articles.length;i++){
            
            let status = 0
            while (status === 0){
            try{
                await putToDynamo({
                    id: `${city.name}:${data.articles[i].publishedAt}`,
                    title:data.articles[i].title
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
    

const getWeatherData =  (city:string) => {
    const url = `https://newsapi.org/v2/everything?q=Weather%20${city}&from=2023-07-06&to=2023-07-07&sortBy=popularity&apiKey=0e0751f2270e4d71a362750a1187ffab`
    const options: { method: string; url: any } = {
        method: 'GET',
        url,
    };
    return axios(options).then((response:AxiosResponse) =>response.data)
}
const putToDynamo = async(item:{id:string,title:string})=>{
    
    const input = {
        TableName: 'weather-news',

        Item: marshall(item),
    }
    const command = new PutItemCommand(input);
    return client.send(command);
}
type WeatherReponse ={
    articles:{title:string,publishedAt:string}[];


}
const sleep = (ms:number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}