import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import * as uuid from 'uuid'
import { UpdateTodoRequest } from "../requests/UpdateTodoRequest"
import { createLogger } from '../utils/logger'
import { getTodosForUserDao, createTodoDao, updateTodoDao, deleteTodoDao, createAttachmentPresignedUrlDao } from '../dataLayer/dataAccess'
import {getAttachmentUrl} from '../dataLayer/bucketAccess'
import { TodoItem} from '../models/TodoItem'
import {TodoUpdate } from '../models/TodoUpdate'


const logger = createLogger('todos')


export async function getTodosForUser(user: string): Promise<string> {
    logger.info('getTodosForUser: ' + user)
    
    const items = await getTodosForUserDao(user)

    const result = '{ "items": ' + JSON.stringify(items) + '}'

    return result
}



export async function createTodo(userId: string, newTodo: CreateTodoRequest): Promise<string> {

    const todoId = uuid.v4()
    const createdAt = new Date().toISOString()
    const done = false
    const attachmentUrl = ""
    const name = newTodo.name
    const dueDate = newTodo.dueDate


    logger.info("Create Todo for user: ", userId, name, dueDate)

    

    const item : TodoItem = {
        userId,
        todoId,
        createdAt,
        name,
        dueDate,
        done, 
        attachmentUrl
    }

    await createTodoDao(item)

    
    const res = {
        todoId,
        createdAt,
        name,
        dueDate,
        done,
        attachmentUrl
    }

    const result = '{ "item": ' + JSON.stringify(res) + '}'

    return result  
}


export async function updateTodo(user: string, todoId: string, updatedTodo: UpdateTodoRequest): Promise<string> {

    const name = updatedTodo.name
    const dueDate = updatedTodo.dueDate
    const done = updatedTodo.done

    const updateTodoItem : TodoUpdate = {
        name, 
        dueDate, 
        done
    }

    await updateTodoDao(user, todoId, updateTodoItem)

    const result = JSON.stringify("")

    return result
}

export async function deleteTodo(user: string, todoId: string): Promise<string> {

    logger.info("delete todo: ", user, todoId)
    await deleteTodoDao(user, todoId)
    
    return ""
}


export async function createAttachmentPresignedUrl(user: string, todoId: string): Promise<string> {

    var timeout = parseInt(process.env.SIGNED_URL_EXPIRATION)
    logger.info("Timeout: " + timeout.toString())

    const attachmentUrl = await getAttachmentUrl(user, todoId, timeout)
    

    logger.info(attachmentUrl)

    await createAttachmentPresignedUrlDao(user, todoId)

    const result = '{ "uploadUrl": ' + JSON.stringify(attachmentUrl) + '}'
    
    return result
}
  