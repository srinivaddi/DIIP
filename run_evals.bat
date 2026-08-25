@echo off
echo ==========================================
echo Running DIIP System Evaluation Suite...
echo ==========================================
.venv\Scripts\python -m pytest backend\tests\evals\
pause
