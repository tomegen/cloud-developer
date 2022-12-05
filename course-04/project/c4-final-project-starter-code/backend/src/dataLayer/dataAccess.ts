import * as AWS from "aws-sdk"
import * as AWSXRay from "aws-xray-sdk"
import {TodoItem } from '../models/TodoItem'
import {TodoUpdate } from '../models/TodoUpdate'


const tableName = process.env.TODOS_TABLE
const XAWS = AWSXRay.captureAWS(AWS)
const docClient = new XAWS.DynamoDB.DocumentClient()


export async function getTodosForUserDao(user: string): Promise<string> {
const result = await docClient.query({
    TableName: process.env.TODOS_TABLE,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': user
    }
}).promise()

return result.Items

}


export async function createTodoDao(item: TodoItem): Promise<void> {

    await docClient
        .put({
        TableName: tableName,
        Item: item
        })
        .promise()
}

export async function updateTodoDao(user: string, todoId: string, updatedTodo: TodoUpdate): Promise<void> {

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

}

export async function deleteTodoDao(user: string, todoId: string): Promise<void> {

    docClient.delete({
        TableName: tableName,
        Key: {
            "userId": user,
            "todoId": todoId
        }
    }).promise()
}

export async function createAttachmentPresignedUrlDao(user: string, todoId: string): Promise<void> {

    const bucket = process.env.ATTACHMENT_S3_BUCKET

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

}



