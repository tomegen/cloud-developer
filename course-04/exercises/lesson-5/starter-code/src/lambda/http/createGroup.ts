import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as AWS  from 'aws-sdk'
import * as uuid from 'uuid'
import { getUserId } from '../../auth/utils'

const docClient = new AWS.DynamoDB.DocumentClient()
const groupsTable = process.env.GROUPS_TABLE

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Processing event: ', event)
  const itemId = uuid.v4()

  const parsedBody = JSON.parse(event.body)
  const userId = getUserId(event.headers.jwtToken)

  const newItem = {
    id: itemId,
    userId: userId,
    ...parsedBody
  }

  await docClient.put({
    TableName: groupsTable,
    Item: newItem
  }).promise()

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      newItem
    })
  }
}
