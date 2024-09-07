'use client'

import { Box, Button, Stack, TextField, CircularProgress } from '@mui/material'
import { useState, KeyboardEvent } from 'react'

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! I'm the Rate My Professor support assistant. How can I help you today?`,
    },
  ])
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return

    setIsLoading(true)
    setMessage('')
    setMessages((prevMessages) => [
      ...prevMessages,
      {role: 'user', content: message},
      {role: 'assistant', content: ''},
    ])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([...messages, {role: 'user', content: message}]),
      })

      if (!response.ok || !response.body) {
        throw new Error('Failed to send message')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value, { stream: true })
        setMessages((prevMessages) => {
          const lastMessage = prevMessages[prevMessages.length - 1]
          const otherMessages = prevMessages.slice(0, prevMessages.length - 1)
          return [
            ...otherMessages,
            {...lastMessage, content: lastMessage.content + text},
          ]
        })
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages((prevMessages) => [
        ...prevMessages,
        {role: 'assistant', content: 'Sorry, there was an error processing your request.'},
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <Stack
        direction={'column'}
        width="500px"
        height="700px"
        border="1px solid black"
        p={2}
        spacing={3}
      >
        <Stack
          direction={'column'}
          spacing={2}
          flexGrow={1}
          overflow="auto"
          maxHeight="100%"
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={
                message.role === 'assistant' ? 'flex-start' : 'flex-end'
              }
            >
              <Box
                bgcolor={
                  message.role === 'assistant'
                    ? 'primary.main'
                    : 'secondary.main'
                }
                color="white"
                borderRadius={16}
                p={3}
              >
                {message.content}
              </Box>
            </Box>
          ))}
        </Stack>
        <Stack direction={'row'} spacing={2}>
          <TextField
            label="Message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <Button 
            variant="contained" 
            onClick={sendMessage}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Send'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
