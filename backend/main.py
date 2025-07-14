from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn
import os
from pathlib import Path

from agent import DocumentRAGAgent

# Initialize FastAPI app
app = FastAPI(
    title="EZ-RAG Document Assistant",
    description="AI-powered document-aware assistant for question answering and challenge generation",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "https://ez-rag-document-processor-rb5o.vercel.app/"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the RAG agent
rag_agent = DocumentRAGAgent()

# Pydantic models for request/response
class QuestionRequest(BaseModel):
    question: str

class AnswerEvaluationRequest(BaseModel):
    question: str
    user_answer: str
    question_id: int

class HealthResponse(BaseModel):
    status: str
    message: str

@app.get("/", response_model=HealthResponse)
async def root():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        message="EZ-RAG Document Assistant is running!"
    )

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Detailed health check endpoint."""
    return HealthResponse(
        status="healthy",
        message="All systems operational"
    )

@app.post("/upload-document")
async def upload_document(file: UploadFile = File(...)):
    """
    Upload and process a document (PDF or TXT).
    
    Returns:
        JSON response with processing status and document summary
    """
    try:
        # Validate file type
        if not file.filename.lower().endswith(('.pdf', '.txt')):
            raise HTTPException(
                status_code=400,
                detail="Invalid file format. Please upload PDF or TXT files only."
            )
        
        # Read file content
        file_content = await file.read()
        
        if len(file_content) == 0:
            raise HTTPException(
                status_code=400,
                detail="Empty file uploaded."
            )
        
        # Process document
        result = rag_agent.process_document(file_content, file.filename)
        
        if result["status"] == "error":
            raise HTTPException(status_code=400, detail=result["message"])
        
        return JSONResponse(
            status_code=200,
            content={
                "status": "success",
                "message": "Document uploaded and processed successfully",
                "data": {
                    "filename": result["filename"],
                    "summary": result["summary"],
                    "chunk_count": result["chunk_count"]
                }
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/ask-anything")
async def ask_anything(request: QuestionRequest):
    """
    Ask any question about the uploaded document.
    
    Returns:
        JSON response with answer and source references
    """
    try:
        if not request.question.strip():
            raise HTTPException(
                status_code=400,
                detail="Question cannot be empty."
            )
        
        result = rag_agent.ask_question(request.question)
        
        if result["status"] == "error":
            raise HTTPException(status_code=400, detail=result["message"])
        
        return JSONResponse(
            status_code=200,
            content={
                "status": "success",
                "data": {
                    "question": result["question"],
                    "answer": result["answer"],
                    "source_snippets": result["source_snippets"]
                }
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/challenge-me")
async def challenge_me():
    """
    Generate three logic-based challenge questions from the document.
    
    Returns:
        JSON response with generated questions
    """
    try:
        result = rag_agent.generate_challenge_questions()
        
        if result["status"] == "error":
            raise HTTPException(status_code=400, detail=result["message"])
        
        return JSONResponse(
            status_code=200,
            content={
                "status": "success",
                "message": "Challenge questions generated successfully",
                "data": {
                    "questions": result["questions"]
                }
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/evaluate-answer")
async def evaluate_answer(request: AnswerEvaluationRequest):
    """
    Evaluate user's answer to a challenge question.
    
    Returns:
        JSON response with evaluation and feedback
    """
    try:
        if not request.user_answer.strip():
            raise HTTPException(
                status_code=400,
                detail="Answer cannot be empty."
            )
        
        if not request.question.strip():
            raise HTTPException(
                status_code=400,
                detail="Question cannot be empty."
            )
        
        result = rag_agent.evaluate_answer(
            request.question,
            request.user_answer,
            request.question_id
        )
        
        if result["status"] == "error":
            raise HTTPException(status_code=400, detail=result["message"])
        
        return JSONResponse(
            status_code=200,
            content={
                "status": "success",
                "message": "Answer evaluated successfully",
                "data": {
                    "question_id": result["question_id"],
                    "question": result["question"],
                    "user_answer": result["user_answer"],
                    "evaluation": result["evaluation"],
                    "score": result["score"],
                    "source_context": result["source_context"]
                }
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/clear-session")
async def clear_session():
    """
    Clear the current session and reset all document data.
    
    Returns:
        JSON response confirming session reset
    """
    try:
        rag_agent.clear_session()
        
        return JSONResponse(
            status_code=200,
            content={
                "status": "success",
                "message": "Session cleared successfully"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/document-info")
async def get_document_info():
    """
    Get information about the currently loaded document.
    
    Returns:
        JSON response with document status and basic info
    """
    try:
        has_document = rag_agent.vector_store is not None
        chunk_count = len(rag_agent.document_chunks) if rag_agent.document_chunks else 0
        conversation_length = len(rag_agent.conversation_history)
        
        return JSONResponse(
            status_code=200,
            content={
                "status": "success",
                "data": {
                    "has_document": has_document,
                    "chunk_count": chunk_count,
                    "conversation_length": conversation_length,
                    "text_length": len(rag_agent.original_text) if rag_agent.original_text else 0
                }
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Exception handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={
            "status": "error",
            "message": "Endpoint not found"
        }
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": "Internal server error"
        }
    )

if __name__ == "__main__":
    # Create uploads directory if it doesn't exist
    uploads_dir = Path("uploads")
    uploads_dir.mkdir(exist_ok=True)
    
    # Run the application
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    )
