import os
from dotenv import load_dotenv

load_dotenv(override=True)

class Config:
    GROQ_API_KEY = os.getenv('GROQ_API_KEY')
    GROQ_MODEL = os.getenv('GROQ_MODEL', 'mixtral-8x7b-32768')
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    SERVICE_HOST = os.getenv('SERVICE_HOST', '0.0.0.0')
    SERVICE_PORT = int(os.getenv('PORT', os.getenv('SERVICE_PORT', '5000')))
    MAX_TOKENS = int(os.getenv('MAX_TOKENS', '1024'))
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    DEBUG = FLASK_ENV == 'development'
