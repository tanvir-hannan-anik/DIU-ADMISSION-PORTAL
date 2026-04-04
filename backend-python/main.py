import logging
from app import create_app
from app.config.settings import Config

logging.basicConfig(
    level=getattr(logging, Config.LOG_LEVEL, logging.INFO),
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)

app = create_app()

if __name__ == '__main__':
    print(f"\n{'='*50}")
    print(f"  DIU AI Microservice Starting...")
    print(f"  Host: {Config.SERVICE_HOST}")
    print(f"  Port: {Config.SERVICE_PORT}")
    print(f"  Model: {Config.GROQ_MODEL}")
    print(f"  Groq API: {'Configured' if Config.GROQ_API_KEY else 'NOT CONFIGURED - Add to .env'}")
    print(f"{'='*50}\n")

    app.run(
        host=Config.SERVICE_HOST,
        port=Config.SERVICE_PORT,
        debug=Config.DEBUG
    )
