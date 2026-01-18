import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = "chat"
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data['message']
        sender_id = data['sender']
        receiver_id = data['receiver']

        # 👇 Import models here (lazy import)
        from django.contrib.auth import get_user_model
        from .models import Message
        User = get_user_model()

        sender = await self.get_user(User, sender_id)
        receiver = await self.get_user(User, receiver_id)

        msg = await self.create_message(Message, sender, receiver, message)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': msg.content,
                'sender': sender.username,
                'receiver': receiver.username
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'sender': event['sender'],
            'receiver': event['receiver']
        }))

    @database_sync_to_async
    def get_user(self, User, user_id):
        return User.objects.get(id=user_id)

    @database_sync_to_async
    def create_message(self, Message, sender, receiver, content):
        return Message.objects.create(sender=sender, receiver=receiver, content=content)
