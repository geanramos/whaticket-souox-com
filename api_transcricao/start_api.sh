#!/bin/bash

rm -rf /home/multi100/api_transcricao/venv

cd /home/multi10/api_transcricao
python3 -m venv venv
source venv/bin/activate

pip install --upgrade pip

pip install Flask==2.1.0
pip install SpeechRecognition==3.10.0
pip install Werkzeug==2.2.2
pip install pydub==0.25.1
pip install gunicorn==20.1.0
pip install ffmpeg-python==0.2.0
pip install python-dotenv==1.0.0

pip install -r requirements.txt

python3 main.py

########################################################################################
# este scritp cria um ambiente virtual e instala as dependencias 
########################################################################################

# para iniciar o serviço com pm2
# pm2 start start_api.sh --name api-transcricao