import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, CheckCircle, X, AlertCircle, Sparkles, MessageSquare, Brain, RefreshCw } from 'lucide-react'
import './App.css'
import { apiService } from './services/api'

function App() {
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [showAlert, setShowAlert] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [alertType, setAlertType] = useState('success') // 'success', 'error', 'info'
  const [documentInfo, setDocumentInfo] = useState(null)
  const [isBackendConnected, setIsBackendConnected] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [questionAnswer, setQuestionAnswer] = useState('')
  const [isAsking, setIsAsking] = useState(false)
  const [challengeQuestions, setChallengeQuestions] = useState([])
  const [isGeneratingChallenges, setIsGeneratingChallenges] = useState(false)
  const [challengeAnswers, setChallengeAnswers] = useState({}) // Store user answers
  const [evaluatingQuestions, setEvaluatingQuestions] = useState(new Set()) // Track which questions are being evaluated
  const [evaluationResults, setEvaluationResults] = useState({}) // Store evaluation results
  const [activeTab, setActiveTab] = useState('upload') // 'upload', 'ask', 'challenge'

  // Check backend connection on component mount
  useEffect(() => {
    checkBackendConnection()
    fetchDocumentInfo()
  }, [])

  const checkBackendConnection = async () => {
    const result = await apiService.healthCheck()
    setIsBackendConnected(result.success)
    if (!result.success) {
      showAlertMessage('Backend connection failed.', 'error')
    }
  }

  const fetchDocumentInfo = async () => {
    const result = await apiService.getDocumentInfo()
    if (result.success) {
      setDocumentInfo(result.data.data)
    }
  }

  const showAlertMessage = (message, type = 'success') => {
    setUploadStatus(message)
    setAlertType(type)
    setShowAlert(true)
    setTimeout(() => setShowAlert(false), 5000)
  }

  const onDrop = async (acceptedFiles) => {
    if (!isBackendConnected) {
      showAlertMessage('Backend not connected. Please check if the FastAPI server is running.', 'error')
      return
    }

    setIsUploading(true)
    
    try {
      for (const file of acceptedFiles) {
        const result = await apiService.uploadDocument(file)
        
        if (result.success) {
          setUploadedFiles(prev => [...prev, {
            ...file,
            processed: true,
            summary: result.data.data.summary,
            chunkCount: result.data.data.chunk_count
          }])
          showAlertMessage(`Successfully uploaded and processed: ${file.name}`, 'success')
          await fetchDocumentInfo() // Refresh document info
        } else {
          showAlertMessage(`Error uploading ${file.name}: ${result.error}`, 'error')
        }
      }
    } catch (error) {
      showAlertMessage(`Upload failed: ${error.message}`, 'error')
    } finally {
      setIsUploading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt']
    },
    multiple: true
  })

  const removeFile = async (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
    // If no files left, clear the session
    if (uploadedFiles.length === 1) {
      await apiService.clearSession()
      await fetchDocumentInfo()
    }
  }

  const handleAskQuestion = async () => {
    if (!currentQuestion.trim()) {
      showAlertMessage('Please enter a question.', 'error')
      return
    }

    if (!documentInfo?.has_document) {
      showAlertMessage('Please upload a document first.', 'error')
      return
    }

    setIsAsking(true)
    try {
      const result = await apiService.askQuestion(currentQuestion)
      if (result.success) {
        setQuestionAnswer(result.data.data.answer)
      } else {
        showAlertMessage(`Error: ${result.error}`, 'error')
      }
    } catch (error) {
      showAlertMessage(`Error asking question: ${error.message}`, 'error')
    } finally {
      setIsAsking(false)
    }
  }

  const handleGenerateChallenges = async () => {
    if (!documentInfo?.has_document) {
      showAlertMessage('Please upload a document first.', 'error')
      return
    }

    setIsGeneratingChallenges(true)
    try {
      const result = await apiService.generateChallenges()
      if (result.success) {
        setChallengeQuestions(result.data.data.questions)
        setChallengeAnswers({}) // Reset answers
        setEvaluationResults({}) // Reset evaluation results
        showAlertMessage('Challenge questions generated successfully!', 'success')
      } else {
        showAlertMessage(`Error: ${result.error}`, 'error')
      }
    } catch (error) {
      showAlertMessage(`Error generating challenges: ${error.message}`, 'error')
    } finally {
      setIsGeneratingChallenges(false)
    }
  }

  const handleAnswerChange = (questionIndex, answer) => {
    setChallengeAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }))
  }

  const handleEvaluateAnswer = async (questionIndex, question) => {
    const userAnswer = challengeAnswers[questionIndex]
    
    if (!userAnswer?.trim()) {
      showAlertMessage('Please provide an answer first.', 'error')
      return
    }

    setEvaluatingQuestions(prev => new Set(prev).add(questionIndex))
    
    try {
      const result = await apiService.evaluateAnswer(question, userAnswer, questionIndex)
      if (result.success) {
        setEvaluationResults(prev => ({
          ...prev,
          [questionIndex]: result.data.data
        }))
        showAlertMessage(`Answer evaluated! Score: ${result.data.data.score}/10`, 'success')
      } else {
        showAlertMessage(`Error: ${result.error}`, 'error')
      }
    } catch (error) {
      showAlertMessage(`Error evaluating answer: ${error.message}`, 'error')
    } finally {
      setEvaluatingQuestions(prev => {
        const newSet = new Set(prev)
        newSet.delete(questionIndex)
        return newSet
      })
    }
  }

  const handleClearSession = async () => {
    try {
      await apiService.clearSession()
      setUploadedFiles([])
      setCurrentQuestion('')
      setQuestionAnswer('')
      setChallengeQuestions([])
      await fetchDocumentInfo()
      showAlertMessage('Session cleared successfully!', 'info')
    } catch (error) {
      showAlertMessage(`Error clearing session: ${error.message}`, 'error')
    }
  }

  return (
    <div className="min-h-screen bg-black text-green-400 overflow-hidden relative">
      {/* Circuit board animated background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Circuit lines */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`circuit-line-${i}`}
            className="absolute bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-20"
            style={{
              height: '1px',
              width: '100%',
              top: `${Math.random() * 100}%`,
            }}
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{
              duration: Math.random() * 8 + 4,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 5
            }}
          />
        ))}
        
        {/* Vertical circuit lines */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`circuit-line-v-${i}`}
            className="absolute bg-gradient-to-b from-transparent via-cyan-400 to-transparent opacity-20"
            style={{
              width: '1px',
              height: '100%',
              left: `${Math.random() * 100}%`,
            }}
            initial={{ y: '-100%' }}
            animate={{ y: '100%' }}
            transition={{
              duration: Math.random() * 10 + 6,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 3
            }}
          />
        ))}

        {/* Circuit nodes */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={`node-${i}`}
            className="absolute w-2 h-2 border border-green-400 bg-green-400/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 2
            }}
          />
        ))}

        {/* Data packets */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={`packet-${i}`}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full shadow-lg"
            style={{
              boxShadow: '0 0 10px rgba(0, 255, 255, 0.8)'
            }}
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight,
              opacity: 0
            }}
            animate={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: Math.random() * 6 + 4,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 3
            }}
          />
        ))}
      </div>

      {/* Alert Component */}
      <AnimatePresence>
        {showAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 right-6 z-50"
          >
            <div className={`circuit-panel backdrop-blur-md rounded-lg p-4 flex items-center gap-3 shadow-lg border ${
              alertType === 'success' ? 'border-green-400/50' :
              alertType === 'error' ? 'border-red-400/50' :
              'border-cyan-400/50'
            }`}>
              {alertType === 'success' && <CheckCircle className="w-5 h-5 text-green-400 animate-circuit-glow" />}
              {alertType === 'error' && <X className="w-5 h-5 text-red-400 animate-circuit-glow" />}
              {alertType === 'info' && <AlertCircle className="w-5 h-5 text-cyan-400 animate-circuit-glow" />}
              <span className={`circuit-text text-sm ${
                alertType === 'success' ? 'text-green-400' :
                alertType === 'error' ? 'text-red-400' :
                'text-cyan-400'
              }`}>
                [{alertType.toUpperCase()}] {uploadStatus}
              </span>
              <button
                onClick={() => setShowAlert(false)}
                className={`hover:opacity-75 transition-colors ${
                  alertType === 'success' ? 'text-green-400' :
                  alertType === 'error' ? 'text-red-400' :
                  'text-cyan-400'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div className={`text-sm circuit-text flex items-center gap-2 ${
              isBackendConnected ? 'text-green-400' : 'text-red-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isBackendConnected ? 'bg-green-400 animate-circuit-pulse' : 'bg-red-400'
              }`} />
              [BACKEND_{isBackendConnected ? 'ONLINE' : 'OFFLINE'}]
            </motion.div>
          </div>
          <h1 className="text-5xl font-bold circuit-text mb-2 animate-circuit-glow">
            EZ-RAG DOCUMENT PROCESSOR
          </h1>
          <div className="flex items-center justify-center gap-2 text-cyan-400 circuit-text-cyan text-sm">
            <span>&gt;</span>
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              Smart_Assistant_for_Research_Summarization
            </motion.span>
            <span className="animate-terminal-blink">_</span>
          </div>
          <p className="text-base text-gray-400 mt-4 font-mono">
            &gt; Upload PDF and TXT files for intelligent document processing
          </p>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <div className="circuit-panel rounded-lg p-1 flex gap-1">
            {[
              { id: 'upload', label: 'UPLOAD', icon: Upload },
              { id: 'ask', label: 'ASK_AI', icon: MessageSquare },
              { id: 'challenge', label: 'CHALLENGES', icon: Brain }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 rounded font-mono text-sm transition-all duration-300 flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-green-400/20 border border-green-400/50 text-green-400 animate-circuit-glow'
                      : 'text-gray-400 hover:text-green-400 hover:bg-green-400/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Upload Card */}
        {activeTab === 'upload' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-2xl mx-auto mb-8"
          >
            <div className="relative group">
              <div 
                {...getRootProps()}
                className={`circuit-panel file-upload-circuit border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-300 ${
                  isDragActive 
                    ? 'border-green-400 bg-green-400/10 scale-105 animate-circuit-glow' 
                    : 'border-gray-600 hover:border-green-400/60'
                }`}
              >
                <input {...getInputProps()} />
                
                <motion.div
                  animate={isUploading ? { rotate: 360 } : { rotate: 0 }}
                  transition={{ duration: 2, repeat: isUploading ? Infinity : 0, ease: "linear" }}
                  className="inline-block mb-4"
                >
                  <Upload className={`w-16 h-16 mx-auto ${
                    isDragActive ? 'text-green-400 animate-circuit-glow' : 'text-gray-500'
                  } transition-colors ${isUploading ? 'animate-circuit-pulse' : ''}`} />
                </motion.div>

                {isUploading ? (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold circuit-text animate-circuit-pulse">
                      [PROCESSING_DATA...]
                    </h3>
                    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden border border-green-400/30">
                      <motion.div
                        className="bg-gradient-to-r from-green-400 to-cyan-400 h-2 rounded-full animate-data-flow"
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 2 }}
                        style={{
                          boxShadow: '0 0 10px rgba(0, 255, 160, 0.6)'
                        }}
                      />
                    </div>
                    <div className="text-sm circuit-text-cyan">
                      &gt; Analyzing file structure...
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold circuit-text">
                      {isDragActive ? '[DROP_FILES_HERE]' : '[FILE_UPLOAD_MODULE]'}
                    </h3>
                    <p className="text-gray-400 font-mono text-sm">
                      &gt; Drag & drop PDF or TXT files here, or click to browse
                    </p>
                    <div className="flex justify-center gap-4 mt-4">
                      <span className="px-3 py-1 bg-red-900/30 text-red-400 rounded border border-red-500/30 text-xs font-mono">
                        .PDF
                      </span>
                      <span className="px-3 py-1 bg-green-900/30 text-green-400 rounded border border-green-500/30 text-xs font-mono">
                        .TXT
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Ask AI Section */}
        {activeTab === 'ask' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto mb-8"
          >
            <div className="circuit-panel rounded-lg p-6">
              <h3 className="text-lg font-semibold circuit-text mb-4">[ASK_ANYTHING_MODULE]</h3>
              
              <div className="space-y-4">
                <div>
                  <textarea
                    value={currentQuestion}
                    onChange={(e) => setCurrentQuestion(e.target.value)}
                    placeholder="&gt; Enter your question about the document..."
                    className="w-full bg-gray-900/50 border border-green-400/30 rounded p-3 text-green-400 font-mono text-sm focus:border-green-400/60 focus:outline-none resize-none"
                    rows={3}
                    disabled={!documentInfo?.has_document}
                  />
                </div>
                
                <button
                  onClick={handleAskQuestion}
                  disabled={isAsking || !documentInfo?.has_document || !currentQuestion.trim()}
                  className="btn-circuit w-full py-3 rounded font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAsking ? '[PROCESSING...]' : '[SUBMIT_QUERY]'}
                </button>
                
                {questionAnswer && (
                  <div className="bg-gray-900/50 border border-cyan-400/30 rounded p-4 mt-4">
                    <h4 className="circuit-text-cyan text-sm mb-2">[AI_RESPONSE]</h4>
                    <p className="text-gray-300 font-mono text-sm leading-relaxed">
                      {questionAnswer}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Challenge Section */}
        {activeTab === 'challenge' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto mb-8"
          >
            <div className="circuit-panel rounded-lg p-6">
              <h3 className="text-lg font-semibold circuit-text mb-4">[CHALLENGE_GENERATOR]</h3>
              
              <button
                onClick={handleGenerateChallenges}
                disabled={isGeneratingChallenges || !documentInfo?.has_document}
                className="btn-circuit w-full py-3 rounded font-mono mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingChallenges ? '[GENERATING...]' : '[GENERATE_CHALLENGES]'}
              </button>
              
              {challengeQuestions.length > 0 && (
                <div className="space-y-6">
                  <h4 className="circuit-text-cyan text-sm">[CHALLENGE_QUESTIONS]</h4>
                  {challengeQuestions.map((question, index) => (
                    <motion.div 
                      key={index} 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="bg-gray-900/50 border border-green-400/30 rounded p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <span className="circuit-text text-xs">[Q{index + 1}]</span>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="px-2 py-1 bg-green-900/50 rounded border border-green-800 text-green-400">
                            {question.type}
                          </span>
                          <span className="px-2 py-1 bg-cyan-900/50 rounded border border-cyan-800 text-cyan-400">
                            {question.difficulty}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-300 font-mono text-sm leading-relaxed mb-4">
                        {question.question}
                      </p>
                      
                      {/* Answer Input Section */}
                      <div className="space-y-3">
                        <label className="block text-xs font-medium text-green-400 font-mono">
                          [YOUR_ANSWER]:
                        </label>
                        <textarea
                          value={challengeAnswers[index] || ''}
                          onChange={(e) => handleAnswerChange(index, e.target.value)}
                          placeholder="Enter your answer here..."
                          className="w-full px-3 py-2 bg-black/40 border border-green-800 rounded 
                                   text-gray-200 placeholder-gray-500 focus:outline-none 
                                   focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20
                                   font-mono text-xs resize-vertical min-h-[80px]"
                          disabled={evaluatingQuestions.has(index)}
                        />
                        
                        {/* Evaluate Button */}
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleEvaluateAnswer(index, question.question)}
                            disabled={evaluatingQuestions.has(index) || !challengeAnswers[index]?.trim()}
                            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-green-600 
                                     hover:from-cyan-500 hover:to-green-500 disabled:from-gray-600 
                                     disabled:to-gray-700 text-white rounded font-mono text-xs
                                     transition-all duration-300 flex items-center gap-2
                                     disabled:cursor-not-allowed"
                          >
                            {evaluatingQuestions.has(index) ? (
                              <>
                                <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                                [EVALUATING...]
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                [EVALUATE]
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Evaluation Results */}
                      {evaluationResults[index] && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4 p-4 bg-gradient-to-r from-green-900/30 to-cyan-900/30 
                                   border border-green-700 rounded"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="text-green-400 font-mono text-xs">[EVALUATION_RESULT]</h5>
                            <div className="flex items-center gap-2">
                              <span className="text-cyan-400 text-xs font-mono">[SCORE]:</span>
                              <span className="text-lg font-bold text-green-400 font-mono">
                                {evaluationResults[index].score}/10
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-3 text-xs">
                            <div>
                              <span className="text-cyan-400 font-mono">[FEEDBACK]:</span>
                              <p className="text-gray-200 mt-1 leading-relaxed font-mono">
                                {evaluationResults[index].feedback}
                              </p>
                            </div>
                            
                            {evaluationResults[index].expected_answer && (
                              <div>
                                <span className="text-cyan-400 font-mono">[EXPECTED]:</span>
                                <p className="text-gray-200 mt-1 leading-relaxed font-mono">
                                  {evaluationResults[index].expected_answer}
                                </p>
                              </div>
                            )}
                            
                            {evaluationResults[index].source_context && (
                              <div>
                                <span className="text-cyan-400 font-mono">[SOURCE]:</span>
                                <p className="text-gray-300 mt-1 text-xs bg-black/20 p-2 rounded border border-green-800 font-mono">
                                  {evaluationResults[index].source_context}
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto"
          >
            <h3 className="text-lg font-semibold mb-4 text-center circuit-text">
              [FILES_IN_MEMORY] ({uploadedFiles.length})
            </h3>
            <div className="space-y-3">
              {uploadedFiles.map((file, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="circuit-panel rounded-lg p-4 group hover:border-green-400/60 transition-all duration-300"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <FileText className="w-5 h-5 text-green-400 animate-circuit-pulse mt-1" />
                      <div className="flex-1">
                        <p className="font-medium circuit-text text-sm">&gt; {file.name}</p>
                        <p className="text-xs text-gray-500 font-mono mb-2">
                          SIZE: {(file.size / 1024).toFixed(1)}KB | STATUS: {file.processed ? 'PROCESSED' : 'UPLOADED'}
                        </p>
                        
                        {file.processed && file.summary && (
                          <div className="bg-gray-900/30 rounded p-2 mt-2">
                            <p className="text-xs circuit-text-cyan mb-1">[DOCUMENT_SUMMARY]</p>
                            <p className="text-xs text-gray-300 font-mono leading-relaxed">
                              {file.summary}
                            </p>
                            {file.chunkCount && (
                              <p className="text-xs text-gray-500 font-mono mt-1">
                                CHUNKS_CREATED: {file.chunkCount}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => removeFile(index)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-900/20 rounded transition-all duration-200 border border-red-500/30 ml-3"
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Status Report */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-2xl mx-auto mt-8"
        >
          <div className="circuit-panel rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <AlertCircle className="w-5 h-5 text-green-400 animate-circuit-glow" />
                </motion.div>
                <h3 className="text-lg font-semibold circuit-text">[SYSTEM_STATUS]</h3>
              </div>
              
              {documentInfo?.has_document && (
                <button
                  onClick={handleClearSession}
                  className="btn-circuit text-xs px-3 py-1 rounded flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  [CLEAR_SESSION]
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-gray-900/50 rounded border border-green-400/30 p-3">
                <p className="text-2xl font-bold circuit-text">{uploadedFiles.length}</p>
                <p className="text-xs text-gray-400 font-mono">LOCAL_FILES</p>
              </div>
              
              <div className="bg-gray-900/50 rounded border border-cyan-400/30 p-3">
                <p className="text-2xl font-bold circuit-text-cyan">
                  {documentInfo?.chunk_count || 0}
                </p>
                <p className="text-xs text-gray-400 font-mono">CHUNKS_PROC</p>
              </div>
              
              <div className="bg-gray-900/50 rounded border border-green-400/30 p-3">
                <p className="text-2xl font-bold circuit-text">
                  {documentInfo?.conversation_length || 0}
                </p>
                <p className="text-xs text-gray-400 font-mono">QUERIES_MADE</p>
              </div>
              
              <div className="bg-gray-900/50 rounded border border-green-400/30 p-3">
                <motion.p 
                  className={`text-2xl font-bold circuit-text ${
                    isBackendConnected ? 'text-green-400' : 'text-red-400'
                  }`}
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {isBackendConnected ? 'ONLINE' : 'OFFLINE'}
                </motion.p>
                <p className="text-xs text-gray-400 font-mono">BACKEND_STATE</p>
              </div>
            </div>
            
            {documentInfo?.has_document && (
              <div className="mt-4 p-3 bg-gray-900/30 rounded border border-green-400/20">
                <p className="text-xs circuit-text-cyan mb-1">[DOCUMENT_INFO]</p>
                <p className="text-xs text-gray-400 font-mono">
                  TEXT_LENGTH: {documentInfo.text_length} characters | 
                  CHUNKS: {documentInfo.chunk_count} | 
                  CONVERSATIONS: {documentInfo.conversation_length}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default App
