@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Установка зависимостей...
python -m pip install -r requirements.txt
echo.
echo Готово. Запускайте start.bat
pause
