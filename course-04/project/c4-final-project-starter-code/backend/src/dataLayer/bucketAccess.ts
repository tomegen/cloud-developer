import * as AWS from "aws-sdk"
import * as AWSXRay from "aws-xray-sdk"
import { createLogger} from '../utils/logger'

const XAWS = AWSXRay.captureAWS(AWS)
const s3 = new XAWS.S3({
    signatureVersion: 'v4'
  })

const logger = createLogger('dataAccess')

export async function getAttachmentUrl(user: string, todoId: string, timeout: number): Promise<string> {

    const bucket = process.env.ATTACHMENT_S3_BUCKET
    logger.info("create attachment presigned url: ", user, todoId)
    const attachmentUrl = await s3.getSignedUrl('putObject', {
        Bucket: bucket,
        Key: todoId,
        Expires: timeout
    })

    return attachmentUrl
}