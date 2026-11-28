@echo off
cd /d "%~dp0"
python -m serum_matcher gui
if errorlevel 1 pause
