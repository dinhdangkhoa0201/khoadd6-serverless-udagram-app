import {S3EventRecord, SNSEvent, SNSHandler} from "aws-lambda";
import "source-map-support/register";
import * as AWS from "aws-sdk";
import Jimp from "jimp/es";

const s3 = new AWS.S3();

const imagesBucket = process.env.IMAGES_S3_BUCKET;
const thumbnailBucket = process.env.THUMBNAILS_S3_BUCKET;

export const handler: SNSHandler = async (event: SNSEvent) => {
    console.log("Processing SNS event ", JSON.stringify(event));
    for (const snsRecord of event.Records) {
        const s3EventStr = snsRecord.Sns.Message;
        console.log("Processing S3 event ", s3EventStr);
        const s3Event = JSON.parse(s3EventStr);

        for (const record of s3Event.Records) {
            await processImage(record);
        }
    }
}

async function processImage(record: S3EventRecord) {
    const key = record.s3.object.key;
    console.log("Processing S3 item with key: ", key);
    const response = await s3.getObject({
        Bucket: imagesBucket,
        Key: key
    }).promise();

    const body = response.Body;
    const image = await Jimp.read(body);
    console.log("Resizing image");

    image.resize(150, Jimp.AUTO);
    const convertedBuffer = await image.getBufferAsync(Jimp.AUTO);

    console.log("Writing image back to S3 bucket: ", thumbnailBucket);
    await s3.putObject({
        Bucket: thumbnailBucket,
        Key: `${key}.jpeg`,
        Body: convertedBuffer
    }).promise();
}
