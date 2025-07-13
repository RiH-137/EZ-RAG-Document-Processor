import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, CheckCircle, X, AlertCircle, Sparkles } from 'lucide-react'
import './App.css'

function App() {
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [showAlert, setShowAlert] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')

  const onDrop = async (acceptedFiles) => {
    setIsUploading(true)
    
    // Simulate upload process
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setUploadedFiles(prev => [...prev, ...acceptedFiles])
    setUploadStatus(`Successfully uploaded ${acceptedFiles.length} file(s)`)
    setShowAlert(true)
    setIsUploading(false)
    
    // Auto-hide alert after 3 seconds
    setTimeout(() => setShowAlert(false), 3000)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt']
    },
    multiple: true
  })

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
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
            <div className="circuit-panel backdrop-blur-md rounded-lg p-4 flex items-center gap-3 shadow-lg border border-green-400/50">
              <CheckCircle className="w-5 h-5 text-green-400 animate-circuit-glow" />
              <span className="circuit-text text-sm">[UPLOAD_COMPLETE] {uploadStatus}</span>
              <button
                onClick={() => setShowAlert(false)}
                className="text-green-400 hover:text-cyan-400 transition-colors"
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
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div className="text-green-400 animate-circuit-glow">
              <span className="text-sm circuit-text">[SYSTEM_INIT]</span>
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

        {/* Upload Card */}
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
                  className="circuit-panel rounded-lg p-4 flex items-center justify-between group hover:border-green-400/60 transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-green-400 animate-circuit-pulse" />
                    <div>
                      <p className="font-medium circuit-text text-sm">&gt; {file.name}</p>
                      <p className="text-xs text-gray-500 font-mono">
                        SIZE: {(file.size / 1024).toFixed(1)}KB | STATUS: LOADED
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-900/20 rounded transition-all duration-200 border border-red-500/30"
                  >
                    <X className="w-4 h-4 text-red-400" />
                  </button>
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
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <AlertCircle className="w-5 h-5 text-green-400 animate-circuit-glow" />
              </motion.div>
              <h3 className="text-lg font-semibold circuit-text">[SYSTEM_STATUS]</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-900/50 rounded border border-green-400/30 p-3">
                <p className="text-2xl font-bold circuit-text">{uploadedFiles.length}</p>
                <p className="text-xs text-gray-400 font-mono">FILES_LOADED</p>
              </div>
              <div className="bg-gray-900/50 rounded border border-cyan-400/30 p-3">
                <p className="text-2xl font-bold circuit-text-cyan">
                  {uploadedFiles.reduce((acc, file) => acc + file.size, 0) > 0 
                    ? Math.round(uploadedFiles.reduce((acc, file) => acc + file.size, 0) / 1024) 
                    : 0}
                </p>
                <p className="text-xs text-gray-400 font-mono">TOTAL_KB</p>
              </div>
              <div className="bg-gray-900/50 rounded border border-green-400/30 p-3">
                <motion.p 
                  className="text-2xl font-bold circuit-text"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ONLINE
                </motion.p>
                <p className="text-xs text-gray-400 font-mono">SYSTEM_STATE</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default App
