import {APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult} from "aws-lambda";
import * as AWS from "aws-sdk";
import "source-map-support/register"

const docClient = new AWS.DynamoDB.DocumentClient();

const connectionsTable = process.env.CONNECTIONS_TABLE;

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log("Websocket connect ", event);

    const connectionId = event.requestContext.connectionId;
    const timestamp = new Date().toISOString();

    const item = {
        id: connectionId,
        timestamp
    }

    console.log("Connection item: ", item);

    await docClient.put({
        TableName: connectionsTable,
        Item: item
    }).promise();

    return {
        statusCode: 200,
        body: ""
    }
}

