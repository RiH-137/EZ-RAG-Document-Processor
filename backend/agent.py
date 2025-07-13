import os
import re
import json
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
import PyPDF2
from io import BytesIO

import numpy as np
from sentence_transformers import SentenceTransformer
import faiss
from groq import Groq
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class DocumentRAGAgent:
    """
    A comprehensive RAG agent for document-aware AI assistant.
    Handles document processing, question answering, and challenge generation.
    """
    
    def __init__(self):
        self.groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.model_name = "deepseek-r1-distill-llama-70b"
        
        # Initialize embeddings model
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Storage for processed documents
        self.vector_store = None
        self.original_text = ""
        self.document_chunks = []
        self.chunk_embeddings = None
        self.conversation_history = []
        
    def _split_text(self, text: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> List[str]:
        """Split text into chunks with overlap."""
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + chunk_size
            
            # Find the last sentence boundary within the chunk
            if end < len(text):
                # Look for sentence endings
                sentence_ends = [m.end() for m in re.finditer(r'[.!?]\s+', text[start:end])]
                if sentence_ends:
                    end = start + sentence_ends[-1]
            
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            start = end - chunk_overlap
            if start >= len(text):
                break
                
        return chunks
    
    def process_document(self, file_content: bytes, filename: str) -> Dict[str, Any]:
        """
        Process uploaded document (PDF or TXT) and create vector store.
        
        Args:
            file_content: Raw file content as bytes
            filename: Name of the uploaded file
            
        Returns:
            Dictionary containing processing status and summary
        """
        try:
            # Extract text based on file type
            if filename.lower().endswith('.pdf'):
                text = self._extract_pdf_text(file_content)
            elif filename.lower().endswith('.txt'):
                text = file_content.decode('utf-8')
            else:
                raise ValueError("Unsupported file format. Please upload PDF or TXT files.")
            
            if not text.strip():
                raise ValueError("No text content found in the document.")
            
            self.original_text = text
            
            # Split text into chunks
            self.document_chunks = self._split_text(text)
            
            # Create embeddings for all chunks
            chunk_embeddings = self.embedding_model.encode(self.document_chunks)
            
            # Create FAISS index
            dimension = chunk_embeddings.shape[1]
            self.vector_store = faiss.IndexFlatL2(dimension)
            self.vector_store.add(chunk_embeddings.astype('float32'))
            self.chunk_embeddings = chunk_embeddings
            
            # Generate summary
            summary = self._generate_summary(text)
            
            # Clear conversation history for new document
            self.conversation_history = []
            
            return {
                "status": "success",
                "message": "Document processed successfully",
                "summary": summary,
                "chunk_count": len(self.document_chunks),
                "filename": filename
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error processing document: {str(e)}"
            }
    
    def _extract_pdf_text(self, file_content: bytes) -> str:
        """Extract text content from PDF file."""
        try:
            pdf_file = BytesIO(file_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            
            return text
        except Exception as e:
            raise ValueError(f"Error extracting PDF content: {str(e)}")
    
    def _generate_summary(self, text: str) -> str:
        """Generate a concise summary of the document (≤ 150 words)."""
        try:
            # Truncate text if too long for API
            max_chars = 8000
            if len(text) > max_chars:
                text = text[:max_chars] + "..."
            
            prompt = f"""
            Please provide a concise summary of the following document in exactly 150 words or less. 
            Focus on the main topics, key findings, and important conclusions.
            
            Document:
            {text}
            
            Summary (≤ 150 words):
            """
            
            response = self.groq_client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=self.model_name,
                temperature=0.3,
                max_tokens=200
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            return f"Error generating summary: {str(e)}"
    
    def _similarity_search(self, query: str, k: int = 3) -> List[str]:
        """Perform similarity search and return top k relevant chunks."""
        if not self.vector_store or not self.document_chunks:
            return []
        
        # Encode the query
        query_embedding = self.embedding_model.encode([query])
        
        # Search for similar chunks
        distances, indices = self.vector_store.search(query_embedding.astype('float32'), k)
        
        # Return relevant chunks
        relevant_chunks = []
        for idx in indices[0]:
            if idx < len(self.document_chunks):
                relevant_chunks.append(self.document_chunks[idx])
        
        return relevant_chunks
    
    def ask_question(self, question: str) -> Dict[str, Any]:
        """
        Answer user questions based on the document content.
        
        Args:
            question: User's question
            
        Returns:
            Dictionary containing answer and source references
        """
        try:
            if not self.vector_store:
                return {
                    "status": "error",
                    "message": "No document has been uploaded yet."
                }
            
            # Retrieve relevant chunks
            relevant_chunks = self._similarity_search(question, k=3)
            context = "\n\n".join(relevant_chunks)
            
            # Add to conversation history
            self.conversation_history.append({"role": "user", "content": question})
            
            # Create context-aware prompt
            conversation_context = ""
            if len(self.conversation_history) > 1:
                recent_conversation = self.conversation_history[-6:]  # Last 3 exchanges
                conversation_context = "\n\nRecent conversation context:\n"
                for msg in recent_conversation[:-1]:  # Exclude current question
                    conversation_context += f"{msg['role']}: {msg['content']}\n"
            
            prompt = f"""
            You are a document-aware AI assistant. Answer the user's question based ONLY on the provided document content.
            
            Document Context:
            {context}
            {conversation_context}
            
            User Question: {question}
            
            Instructions:
            1. Answer based ONLY on the provided document content
            2. Do not hallucinate or add information not in the document
            3. If the information is not in the document, clearly state this
            4. Provide specific references to support your answer (e.g., "This is mentioned in the document...")
            5. Be concise but comprehensive
            
            Answer:
            """
            
            response = self.groq_client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=self.model_name,
                temperature=0.2,
                max_tokens=500
            )
            
            answer = response.choices[0].message.content.strip()
            
            # Add assistant response to conversation history
            self.conversation_history.append({"role": "assistant", "content": answer})
            
            # Extract source snippets
            source_snippets = [chunk[:200] + "..." for chunk in relevant_chunks]
            
            return {
                "status": "success",
                "answer": answer,
                "source_snippets": source_snippets,
                "question": question
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error answering question: {str(e)}"
            }
    
    def generate_challenge_questions(self) -> Dict[str, Any]:
        """
        Generate three logic-based/comprehension questions from the document.
        
        Returns:
            Dictionary containing generated questions
        """
        try:
            if not self.vector_store:
                return {
                    "status": "error",
                    "message": "No document has been uploaded yet."
                }
            
            # Select diverse chunks (beginning, middle, end)
            total_chunks = len(self.document_chunks)
            if total_chunks >= 3:
                indices = [0, total_chunks // 2, total_chunks - 1]
                selected_chunks = [self.document_chunks[i] for i in indices]
            else:
                selected_chunks = self.document_chunks
            
            context = "\n\n---\n\n".join(selected_chunks)
            
            prompt = f"""
            Based on the following document content, generate exactly 3 challenging questions that test:
            1. Comprehension and understanding
            2. Logic and reasoning
            3. Inference and analysis
            
            Document Content:
            {context}
            
            Requirements for questions:
            - Questions should require deep understanding, not just factual recall
            - Include questions that test logical reasoning or inference
            - Avoid yes/no questions
            - Each question should be answerable from the document content
            - Make questions thought-provoking and analytical
            
            Format your response as a JSON object with this structure:
            {{
                "questions": [
                    {{
                        "id": 1,
                        "question": "Your first question here",
                        "type": "comprehension"
                    }},
                    {{
                        "id": 2,
                        "question": "Your second question here",
                        "type": "logic"
                    }},
                    {{
                        "id": 3,
                        "question": "Your third question here",
                        "type": "inference"
                    }}
                ]
            }}
            
            JSON Response:
            """
            
            response = self.groq_client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=self.model_name,
                temperature=0.7,
                max_tokens=800
            )
            
            response_text = response.choices[0].message.content.strip()
            
            # Extract JSON from response
            try:
                # Find JSON in the response
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if json_match:
                    questions_data = json.loads(json_match.group())
                else:
                    raise ValueError("No valid JSON found in response")
                
                return {
                    "status": "success",
                    "questions": questions_data.get("questions", [])
                }
                
            except json.JSONDecodeError:
                # Fallback: parse manually if JSON parsing fails
                return self._fallback_question_generation(context)
                
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error generating questions: {str(e)}"
            }
    
    def _fallback_question_generation(self, context: str) -> Dict[str, Any]:
        """Fallback method for question generation if JSON parsing fails."""
        try:
            prompt = f"""
            Generate 3 challenging questions based on this document content. 
            Number each question (1., 2., 3.) and make them test comprehension, logic, and inference.
            
            Document: {context[:2000]}...
            
            Questions:
            """
            
            response = self.groq_client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=self.model_name,
                temperature=0.7,
                max_tokens=400
            )
            
            response_text = response.choices[0].message.content.strip()
            
            # Parse questions manually
            questions = []
            lines = response_text.split('\n')
            question_types = ["comprehension", "logic", "inference"]
            
            current_question = ""
            question_count = 0
            
            for line in lines:
                line = line.strip()
                if re.match(r'^\d+\.', line) and question_count < 3:
                    if current_question:
                        questions.append({
                            "id": question_count,
                            "question": current_question.strip(),
                            "type": question_types[question_count - 1] if question_count > 0 else "comprehension"
                        })
                    current_question = re.sub(r'^\d+\.\s*', '', line)
                    question_count += 1
                elif current_question and line:
                    current_question += " " + line
            
            # Add the last question
            if current_question and question_count <= 3:
                questions.append({
                    "id": question_count,
                    "question": current_question.strip(),
                    "type": question_types[question_count - 1] if question_count > 0 else "inference"
                })
            
            return {
                "status": "success",
                "questions": questions[:3]  # Ensure only 3 questions
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error in fallback question generation: {str(e)}"
            }
    
    def evaluate_answer(self, question: str, user_answer: str, question_id: int) -> Dict[str, Any]:
        """
        Evaluate user's answer to a challenge question.
        
        Args:
            question: The original question
            user_answer: User's response
            question_id: ID of the question
            
        Returns:
            Dictionary containing evaluation and feedback
        """
        try:
            if not self.vector_store:
                return {
                    "status": "error",
                    "message": "No document has been uploaded yet."
                }
            
            # Retrieve relevant context for the question
            relevant_chunks = self._similarity_search(question, k=3)
            context = "\n\n".join(relevant_chunks)
            
            prompt = f"""
            You are evaluating a user's answer to a question based on a document.
            
            Document Context:
            {context}
            
            Original Question: {question}
            
            User's Answer: {user_answer}
            
            Your task:
            1. Evaluate the accuracy and completeness of the user's answer
            2. Provide constructive feedback
            3. Reference specific parts of the document that support or contradict the answer
            4. Give a score from 1-10 (10 being perfect)
            5. Suggest improvements if needed
            
            Evaluation Criteria:
            - Accuracy based on document content
            - Completeness of the response
            - Understanding of key concepts
            - Logical reasoning
            
            Provide your evaluation in this format:
            Score: X/10
            Feedback: [Your detailed feedback]
            Document Reference: [Specific references from the document]
            Suggestions: [How to improve the answer, if needed]
            """
            
            response = self.groq_client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=self.model_name,
                temperature=0.3,
                max_tokens=600
            )
            
            evaluation = response.choices[0].message.content.strip()
            
            # Extract score
            score_match = re.search(r'Score:\s*(\d+)/10', evaluation)
            score = int(score_match.group(1)) if score_match else 0
            
            return {
                "status": "success",
                "question_id": question_id,
                "question": question,
                "user_answer": user_answer,
                "evaluation": evaluation,
                "score": score,
                "source_context": [chunk[:200] + "..." for chunk in relevant_chunks]
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error evaluating answer: {str(e)}"
            }
    
    def get_document_snippet(self, query: str) -> Optional[str]:
        """
        Get specific document snippet that supports an answer.
        
        Args:
            query: Search query to find relevant snippet
            
        Returns:
            Relevant document snippet or None
        """
        try:
            if not self.vector_store:
                return None
            
            relevant_chunks = self._similarity_search(query, k=1)
            if relevant_chunks:
                return relevant_chunks[0]
            return None
            
        except Exception:
            return None
    
    def clear_session(self):
        """Clear the current session and reset all data."""
        self.vector_store = None
        self.original_text = ""
        self.document_chunks = []
        self.chunk_embeddings = None
        self.conversation_history = []
