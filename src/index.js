const express=require('express')
const path=require('path')
const http=require('http')
const Filter=require('bad-words')
const socketio=require('socket.io')
const { generateMessage, generateLocationMessage } = require('./utils/message')
const { addUser, removeUser,getUser,getUsersInRoom } = require('./utils/users')

const app=express()
const server=http.createServer(app)
const io=socketio(server)


const publicpath=path.join(__dirname,'../public')
app.use(express.static(publicpath))

io.on('connection',(socket)=>{

   
    socket.on('join',({username,room},callback)=>{

        const {error,user}=addUser({id:socket.id,username,room})
        if(error)
        {
            return callback(error)
        }

        socket.join(user.room)
        console.log('WEb Socket connected')
        socket.emit('message',generateMessage('Admin','Welcome!'))
        socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined`))

        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUsersInRoom(user.room)
        })
        callback()
    })

    

    socket.on('sendMessage',(message,callback)=>{

        const user=getUser(socket.id)
        const filter=new Filter()
        if(filter.isProfane(message))
            return callback('Profinity is not allowed..')
        io.to(user.room).emit('message',generateMessage(user.username,message))
        callback()
    })

    socket.on('sendLocation',(location,callback)=>{
        const user=getUser(socket.id)
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://google.com/maps?q=${location.latitude},${location.longitude}`))
        callback()
    })

    socket.on('disconnect',()=>{
        const user=removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left!`))
            io.to(user.room).emit('roomData',{
                room:user.room,
                users:getUsersInRoom(user.room)
            })
        }
        
    })
})

const port=process.env.PORT || 3000
server.listen(port,()=>{
    console.log(`Server is running on port ${port}`)
})

