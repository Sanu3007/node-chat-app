const socket=io()

//Elements
const $messageform=document.querySelector('#message-form')
const $messageformInput=document.querySelector('input')
const $messageformButton=document.querySelector('button')
const $sendlocation=document.querySelector('#send-location')
const $message=document.querySelector('#message')
const $sidebar=document.querySelector('#sidebar')


//Template
const messageTemplate=document.querySelector('#message-template').innerHTML
const locationMessageTemplate=document.querySelector('#location-message-template').innerHTML
const sidebarTemplate=document.querySelector('#sidebar-template').innerHTML

//Options
const {username,room}=Qs.parse(location.search,{ignoreQueryPrefix:true})


const autoscroll=()=>{
    //New Message
    const $newMessage=$message.lastElementChild

    //Height of new Message
    const newMessageStyles=getComputedStyle($newMessage)
    const newMessageMargin=parseInt(newMessageStyles.marginBottom)
    const newMessageHeight=$newMessage.offsetHeight+newMessageMargin

    //Visible height
    const visibleHeight=$message.offsetHeight

    //Height of message container
    const containerHeight=$message.scrollHeight

    //How far I have scrolled
    const scrollOffset=$message.scrollTop+visibleHeight

    if(containerHeight-newMessageHeight<=scrollOffset){
        $message.scrollTop=$message.scrollHeight
    }

}

socket.on('message',(message)=>{
    console.log(message.text)
    const html=Mustache.render(messageTemplate,{
        username:message.username,
        message:message.text,
        createdAt:moment(message.createdAt).format('h:mm a')  
    })
    $message.insertAdjacentHTML('beforeend',html)
    autoscroll()   
})

socket.on('locationMessage',(message)=>{
    console.log(message.url)
    const html=Mustache.render(locationMessageTemplate,{
        username:message.username,
        url:message.url,
        createdAt:moment(message.createdAt).format('h:mm a')
    })
    $message.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('roomData',({room,users})=>{
    // console.log(room)
    // console.log(users)
    const html=Mustache.render(sidebarTemplate,{
        room,
        users
    })
    $sidebar.innerHTML=html

})

$messageform.addEventListener('submit',(e)=>{
    e.preventDefault()
    //Disable
    $messageformButton.setAttribute('disabled','disabled')

    const message=e.target.elements.message.value
    socket.emit('sendMessage',message,(error)=>{

        //Enable Button
        $messageformButton.removeAttribute('disabled')
        $messageformInput.value=''
        $messageformInput.focus()
        if(error)
            return console.log(error)
        console.log('Message is delivered!!')
    })
})

$sendlocation.addEventListener('click',()=>{

    if(!navigator.geolocation)
        return alert('Geolocation not supported')
    //Disable Button
    $sendlocation.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position)=>{
        
        const location={
            latitude:position.coords.latitude,
            longitude:position.coords.longitude
        }
        socket.emit('sendLocation',location,()=>{
            //Enable Button
            $sendlocation.removeAttribute('disabled')
            console.log('Location shared!!')
        })
        //console.log(location)
    })
})

socket.emit('join',{username,room},(error)=>{
    if(error){
        alert(error)
        location.href='./'
    }
})
