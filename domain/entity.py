import os
from mongoengine import connect, Document


class Entity(Document):
    meta = {
        'abstract': True
    }
    uri = F"mongodb+srv://{os.getenv('USER_NAME')}:{os.getenv('PASSWORD')}@{os.getenv('HOST_NAME')}/?retryWrites=true&w=majority&appName={os.getenv('APP_NAME')}"

    # Create a new client and connect to the server
    connect(host=uri)

    # Send a ping to confirm a successful connection
    try:
        # client.admin.command('ping')
        print("Pinged your deployment. You successfully connected to MongoDB!")
    except Exception as e:
        print(e)
