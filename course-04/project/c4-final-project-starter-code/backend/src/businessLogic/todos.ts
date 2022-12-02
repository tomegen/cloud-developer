import * as AWS from "aws-sdk"
import * as AWSXRay from "aws-xray-sdk"
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import * as uuid from 'uuid'
import { UpdateTodoRequest } from "../requests/UpdateTodoRequest"
import { createLogger} from '../utils/logger'

const XAWS = AWSXRay.captureAWS(AWS)
const docClient = new XAWS.DynamoDB.DocumentClient()
const s3 = new XAWS.S3({
    signatureVersion: 'v4'
  })
const logger = createLogger('auth')


export async function getTodosForUser(user: string): Promise<string> {
    logger.info('getTodosForUser: ', user)
    const result = await docClient.query({
        TableName: process.env.TODOS_TABLE,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': user
        }
    }).promise()

    const items = result.Items

    return '{ "items": ' + JSON.stringify(items) + '}'
}



export async function createTodo(userId: string, newTodo: CreateTodoRequest): Promise<string> {

    const todoId = uuid.v4()
    const createdAt = new Date().toISOString()
    const tableName = process.env.TODOS_TABLE
    const done = false
    const attachmentUrl = ""

    logger.info("Create Todo for user: ", userId, newTodo.name, newTodo.dueDate)

    /*const cloudwatch = new AWS.CloudWatch()
    await cloudwatch.putMetricData({
        MetricData: [
            {
                MetricName: 'RequestsCount',
                Unit: 'Count',
                Value: 1
            }

        ],
        Namespace: 'Udacity/Serverless'
    }).promise()*/

    const name = newTodo.name
    const dueDate = newTodo.dueDate


    const item = {
        userId,
        todoId,
        createdAt,
        name,
        dueDate,
        done, 
        attachmentUrl
    }

    await docClient
        .put({
        TableName: tableName,
        Item: item
        })
        .promise()

    
    const result = {
        todoId,
        createdAt,
        name,
        dueDate,
        done,
        attachmentUrl
    }
    return '{ "item": ' + JSON.stringify(result) + '}'

}


export async function updateTodo(user: string, todoId: string, updatedTodo: UpdateTodoRequest): Promise<string> {

    const tableName = process.env.TODOS_TABLE

    docClient.update({
        TableName: tableName,
        Key: {
            "userId": user,
            "todoId": todoId
        },
        ExpressionAttributeNames: {"#N": "name"},
        UpdateExpression: "set #N = :name, dueDate = :dueDate, done = :done",
        ExpressionAttributeValues: {
            ':name': updatedTodo.name,
            ':dueDate': updatedTodo.dueDate,
            ':done': updatedTodo.done
        },
        ReturnValues: "UPDATED_NEW"
    }).promise()

    return JSON.stringify("")
}

export async function deleteTodo(user: string, todoId: string): Promise<string> {

    const tableName = process.env.TODOS_TABLE

    logger.info("delete todo: ", user, todoId)
    docClient.delete({
        TableName: tableName,
        Key: {
            "userId": user,
            "todoId": todoId
        }
    }).promise()


    return ""
}


export async function createAttachmentPresignedUrl(user: string, todoId: string): Promise<string> {

    var timeout = parseInt(process.env.SIGNED_URL_EXPIRATION)
    logger.info("Timeout: " + timeout.toString())
    const bucket = process.env.ATTACHMENT_S3_BUCKET
    logger.info("create attachment presigned url: ", user, todoId)
    const attachmentUrl = await s3.getSignedUrl('putObject', {
        Bucket: bucket,
        Key: todoId,
        Expires: timeout
    })

    logger.info(attachmentUrl)

    const tableName = process.env.TODOS_TABLE

    docClient.update({
        TableName: tableName,
        Key: {
            "userId": user,
            "todoId": todoId
        },
        ExpressionAttributeNames: {"#N": "attachmentUrl"},
        UpdateExpression: "set #N = :attachmentUrl",
        ExpressionAttributeValues: {
            ':attachmentUrl': 'https://' + bucket +'.s3.amazonaws.com/' + todoId
        },
        ReturnValues: "UPDATED_NEW"
    }).promise()


    return '{ "uploadUrl": ' + JSON.stringify(attachmentUrl) + '}'
}
  