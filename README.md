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

## Complete Workflow Guide

### Step 1: Initial Setup
1. **Clone/Download the project** to your local machine
2. **Start the Backend Server** (follow Backend Setup above)
3. **Start the Frontend Server** (follow Frontend Setup above)
4. **Verify both servers are running**:
   - Backend: http://127.0.0.1:8000
   - Frontend: http://localhost:5173

### Step 2: Upload Documents
1. **Navigate to the Upload tab** in the frontend interface
2. **Check connection status** - ensure the backend connection indicator shows "Connected"
3. **Select files** - Choose PDF or TXT documents from your computer
4. **Upload documents** - Click the upload button and wait for processing
5. **Review document summary** - The system will display a summary of uploaded content
6. **Verify upload success** - Check that your document appears in the document list

### Step 3: Ask Questions (RAG Functionality)
1. **Navigate to the Ask AI tab**
2. **Enter your question** about the uploaded documents in the text input
3. **Submit your query** - Click the ask button or press Enter
4. **Review AI response** - The system will provide answers based on your documents
5. **Ask follow-up questions** - Continue the conversation as needed
6. **Clear session** if you want to start fresh with new documents

### Step 4: Challenge Mode
1. **Navigate to the Challenges tab**
2. **Generate challenge questions** - Click to create questions based on your documents
3. **Answer the questions** - Type your responses in the provided fields
4. **Submit for evaluation** - Get AI feedback on your answers
5. **Review feedback** - Learn from the evaluation to improve understanding

### Step 5: Session Management
1. **Monitor session status** - Check the status panel for current session info
2. **Clear session** when switching to different documents
3. **Upload new documents** as needed for different topics
4. **Track document information** using the document info endpoint

### Troubleshooting Workflow
1. **Backend Connection Issues**:
   - Check if backend server is running on port 8000
   - Verify no firewall blocking the connection
   - Restart backend server if needed
   - Use Chrome if it is not working well.

2. **Upload Failures**:
   - Ensure file formats are PDF or TXT
   - Verify backend processing logs

3. **AI Response Issues**:
   - Confirm documents are properly uploaded
   - Check if questions are related to document content
   - Clear session and re-upload if needed

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

## Usage Tips:
- **Best Results**: Upload documents with clear, structured content
- **Question Quality**: Ask specific questions about document content
- **Session Management**: Clear sessions when switching document topics
- **Performance**: Monitor backend status for optimal response times
- **File Formats**: Currently supports PDF and TXT files
- **Challenge Mode**: Use for testing comprehension of uploaded material

## Development Notes:
- Backend uses FastAPI with async processing
- Frontend built with React and Vite for fast development
- RAG implementation using document chunking and vector embeddings
- Circuit-themed UI with dark mode design
- Real-time status monitoring and error handling

## POSTMAN Report
[Postman Collection](https://cohortlab-job-portal.postman.co/workspace/CohortLab-Job-portal-Workspace~5f720074-83d8-4b59-891e-9bd4effc3745/collection/27539320-35da9efd-d99f-4fec-9600-818c6ed12ad7?action=share&creator=27539320)



#### Postman Dumps [Img]
<img width="1362" height="955" alt="image" src="https://github.com/user-attachments/assets/953ca2ad-09e4-42b9-8091-925c614bfa33" />
<img width="1333" height="1054" alt="image" src="https://github.com/user-attachments/assets/058fa5a5-006d-4b2d-8cec-28937a3fbc88" />
<img width="1349" height="1067" alt="image" src="https://github.com/user-attachments/assets/307b4aa7-d239-42ac-b44f-5aa7a62dcda6" />
<img width="1344" height="1055" alt="image" src="https://github.com/user-attachments/assets/c0e71a79-70ba-498e-b178-0a442b3c2fa0" />
<img width="1370" height="1044" alt="image" src="https://github.com/user-attachments/assets/54943610-dcd2-48bf-9ab1-74f2a5f693c8" />
<img width="1386" height="917" alt="image" src="https://github.com/user-attachments/assets/675b18f9-36a4-4236-a1a4-d7bb6d2e901b" />





