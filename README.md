# EZ-RAG Development Setup

## Backend Setup (FastAPI)
1. Navigate to backend directory:
   ```
   cd backend
   ```

2. Create and activate virtual environment (if not already done):
   ```
   python -m venv myEnv
   myEnv\Scripts\activate  # On Windows
   # source myEnv/bin/activate  # On Linux/Mac
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Start the FastAPI server:
   ```
   python main.py
   ```
   Or:
   ```
   uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```

The backend will be available at: http://127.0.0.1:8000

## Frontend Setup (React + Vite)
1. Navigate to frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

The frontend will be available at: http://localhost:5173

## API Endpoints Available:
- `GET /health` - Health check
- `POST /upload-document` - Upload PDF/TXT files
- `POST /ask-anything` - Ask questions about uploaded documents
- `POST /challenge-me` - Generate challenge questions
- `POST /evaluate-answer` - Evaluate answers to challenge questions
- `POST /clear-session` - Clear current session
- `GET /document-info` - Get document information

## Features Integrated:
✅ File upload with real-time backend processing
✅ Document summarization display
✅ AI question answering
✅ Challenge question generation
✅ Backend connection status monitoring
✅ Session management
✅ Error handling and user feedback
✅ Circuit-themed dark UI

## Usage:
1. Start both backend and frontend servers
2. Upload PDF or TXT files in the Upload tab
3. Ask questions about your documents in the Ask AI tab
4. Generate and answer challenge questions in the Challenges tab
5. Monitor system status in the status panel
