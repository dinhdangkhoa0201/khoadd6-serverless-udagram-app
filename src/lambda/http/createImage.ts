import {APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda";
import 'source-map-support/register'
import * as AWS from "aws-sdk";
import * as uuid from "uuid";
import * as middy from "middy";
import {cors} from "middy/middlewares";
import * as AWSXRay from "aws-xray-sdk";

const XAWS = AWSXRay.captureAWS(AWS);

const s3 = new XAWS.S3({
    signatureVersion: 'v4'
})

const docClient = new AWS.DynamoDB.DocumentClient();

const groupsTable = process.env.GROUPS_TABLE;
const imagesTable = process.env.IMAGES_TABLE;
const bucketName = process.env.IMAGES_S3_BUCKET;
const urlExpiration = process.env.SINGED_URL_EXPIRATION;


export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('Caller event', event)
    const groupId = event.pathParameters.groupId
    const validGroupId = await groupExists(groupId)

    if (!validGroupId) {
        return {
            statusCode: 404,
            body: JSON.stringify({
                error: 'Group does not exist'
            })
        }
    }
    // TODO: Create an image
    const imageId = uuid.v4();
    const newItem = createImage(groupId, imageId, event);
    const url = getUploadUrl(imageId);
    console.log("New image ", newItem);

    return {
        statusCode: 201,
        body: JSON.stringify({
            newItem,
            url
        })
    }
});

handler.use(
    cors({
        credentials: true
    })
)

async function createImage(groupId: string, imageId: string, event: any) {
    const timestamp = new Date().toISOString();
    const newImage = JSON.parse(event.body);

    const newItem = {
        groupId: groupId,
        timestamp: timestamp,
        imageId: imageId,
        ...newImage,
        imageUrl: `https://${bucketName}.s3.amazonaws.com/${imageId}`
    }
    console.log("Storing new image ", newItem);

    await docClient.put({
        TableName: imagesTable,
        Item: newItem
    }).promise();

    return newItem;
}

async function groupExists(groupId: string) {
    const result = await docClient
        .get({
            TableName: groupsTable,
            Key: {
                id: groupId
            }
        })
        .promise()

    console.log('Get group: ', result)
    return !!result.Item
}

function getUploadUrl(imageId: string) {
    return s3.getSignedUrl('putObject', {
        Bucket: bucketName,
        Key: imageId,
        Expires: urlExpiration
    })
}
