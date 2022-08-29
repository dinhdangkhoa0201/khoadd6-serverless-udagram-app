import {APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult} from "aws-lambda";
import * as AWS from "aws-sdk"

const docClient = new AWS.DynamoDB.DocumentClient();

const groupsTable = process.env.GROUPS_TABLE;
const imagesTable = process.env.IMAGES_TABLE;

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log("Processing event: ", event);

    const groupId = event.pathParameters.groupId;

    const validateGroupId = await groupExists(groupId);

    if (!validateGroupId) {
        return {
            statusCode: 404,
            headers: {
                "Access-Controll-Allow-Origin": "*"
            },
            body: JSON.stringify({
                error: "Group does not exist!"
            })
        }
    }

    const images = await getImagesPerGroup(groupId);

    return {
        statusCode: 201,
        headers: {
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({
            items: images
        })
    }
}

async function groupExists(groupId: string) {
    const result = await docClient.get({
        TableName: groupsTable,
        Key: {
            id: groupId
        }
    }).promise();

    console.log("Get group: ", groupId);
    return !!result.Item
}

async function getImagesPerGroup(groupId: string) {
    const result = await docClient.query({
        TableName: imagesTable,
        KeyConditionExpression: 'groupId = :groupId',
        ExpressionAttributeValues: {
            ':groupId': groupId
        },
        ScanIndexForward: false
    }).promise();

    return result.Items
}
