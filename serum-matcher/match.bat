@echo off
chcp 65001 >nul
rem Перетащите аудиофайл на этот файл - в консоли появятся похожие пресеты.
cd /d "%~dp0"
python -m serum_matcher match "%~1" --top 20
pause
