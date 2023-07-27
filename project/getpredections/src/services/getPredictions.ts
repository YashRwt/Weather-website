import { SageMakerRuntimeClient, InvokeEndpointCommand } from "@aws-sdk/client-sagemaker-runtime";
import { format } from 'date-fns';
export async function getPredictions(historicalData:{date:string,temperature:number}[],city:{id:number,elevation:number}):Promise<{date:string,temperature:number}[]> {
  // Create an instance of the SageMaker Runtime client
  const sagemakerClient = new SageMakerRuntimeClient({region:'us-east-1' });

  // Construct the request parameters
  const endpointName = 'deepar-weather-forecast-2023-07-06-23-18-56-198'; // The name of your SageMaker endpoint
  let startTimestamp = new Date(historicalData[historicalData.length-1].date)
  startTimestamp.setHours(startTimestamp.getHours()+1)

  const target = historicalData.map(entry=>entry.temperature).slice(-20)
  const start = format(startTimestamp, 'yyyy-MM-dd HH:mm:ss')
  const dynamic_feat = [Array(44).fill(city.elevation)]
  const cat = [city.id]

  console.log(JSON.stringify({target,start,dynamic_feat,cat}))
  // Create an instance of the InvokeEndpointCommand
  const command = new InvokeEndpointCommand({
    EndpointName: endpointName,
    Body:JSON.stringify({
        instances: [
            {
                start,  // start timestamp
                target, // last 20 hours weather data
                dynamic_feat, //static features 
                cat // city id (0 for New York)
            }
        ],
        configuration: {
            num_samples: 100,
            output_types: ["quantiles"],
            quantiles: ["0.5"]
        }
    }),
    ContentType: 'application/json',
    Accept: 'application/json'
  });
  
  // Invoke the SageMaker endpoint
  let sageMakerResponse = await sagemakerClient.send(command);

  
  const response = JSON.parse(sageMakerResponse.Body.transformToString());
  console.log(JSON.stringify({response}))
  const values = response.predictions[0].quantiles['0.5']
  
  let predictions = []
  
  
  for (const value of values){
    let date = startTimestamp
    predictions.push({
      date : format(date, 'yyyy-MM-dd HH:mm:ss'),
      temperature:value
    })
    date.setHours(date.getHours() +1)
  }
  return predictions
  
}