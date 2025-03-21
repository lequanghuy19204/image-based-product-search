import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        ssl_certfile=r'C:\certs\localhost+2.pem',
        ssl_keyfile=r'C:\certs\localhost+2-key.pem'
    ) 