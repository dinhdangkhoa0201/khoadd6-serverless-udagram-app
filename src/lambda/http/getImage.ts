import {APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult} from "aws-lambda";
import * as AWS from "aws-sdk";
import "source-map-support/register"

const docClient = new AWS.DynamoDB.DocumentClient();

const imagesTable = process.env.IMAGES_TABLE;
const imagesIdIndex = process.env.IMAGE_ID_INDEX;

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log("Processing event: ", event);

    const imageId = event.pathParameters.imageId;

    const result = await docClient.query({
        TableName: imagesTable,
        IndexName: imagesIdIndex,
        KeyConditionExpression: "imageId = :imageId",
        ExpressionAttributeValues: {
            ":imageId": imageId
        }
    }).promise();

    if (result.Count !== 0) {
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify(result.Items[0])
        }
    }

    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "*"
        },
        body: ""
    }
}
