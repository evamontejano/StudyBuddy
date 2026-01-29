import { useState, useRef } from 'react';
import { Upload, File, Image, Type, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Textarea } from '../ui/textarea';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { lessonsListCache } from '../../../lib/lessons-cache';

interface UploadLessonProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type UploadState = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

export function UploadLesson({ open, onOpenChange, onSuccess }: UploadLessonProps) {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileName, setFileName] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      setFileName(file.name);
      if (!lessonTitle) {
        setLessonTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleFileSelect = (file: File) => {
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'image/png', 'image/jpeg', 'image/jpg'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload PDF, DOC, DOCX, PPTX, or images.');
      return;
    }

    if (file.size > maxSize) {
      toast.error('File size exceeds 10MB limit.');
      return;
    }

    setSelectedFile(file);
    setFileName(file.name);
    if (!lessonTitle) {
      setLessonTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const uploadFileToBackend = async () => {
    if (!selectedFile || !lessonTitle.trim()) {
      toast.error('Please provide a lesson title and select a file');
      return;
    }

    const userId = localStorage.getItem('userId');
    if (!userId) {
      toast.error('User not authenticated. Please log in again.');
      return;
    }

    setUploadState('uploading');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('title', lessonTitle.trim());
      formData.append('file', selectedFile);

      const response = await fetch('http://localhost:8080/api/lessons/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setUploadState('success');
        // Invalidate cache and call onSuccess to refresh lessons
        lessonsListCache.invalidate();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      setUploadState('error');
      toast.error('❌ Something went wrong. Please retry uploading your lesson.', {
        duration: 3000,
        style: {
          borderRadius: '8px',
        },
      });
    }
  };

  const handleTextUpload = async () => {
    if (!textContent.trim() || !lessonTitle.trim()) {
      toast.error('Please provide both title and content');
      return;
    }

    const userId = localStorage.getItem('userId');
    if (!userId) {
      toast.error('User not authenticated. Please log in again.');
      return;
    }
    
    setUploadState('uploading');
    setFileName('Text Content');

    try {
      const response = await fetch('http://localhost:8080/api/lessons/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: parseInt(userId),
          title: lessonTitle.trim(),
          text: textContent.trim(),
        }),
      });

      if (response.ok) {
        setUploadState('success');
        // Invalidate cache and call onSuccess to refresh lessons
        lessonsListCache.invalidate();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      setUploadState('error');
      toast.error('❌ Something went wrong. Please retry uploading your lesson.', {
        duration: 3000,
        style: {
          borderRadius: '8px',
        },
      });
    }
  };

  const handleClose = () => {
    setUploadState('idle');
    setUploadProgress(0);
    setFileName('');
    setLessonTitle('');
    setTextContent('');
    setSelectedFile(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        {uploadState === 'idle' && (
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Upload className="h-5 w-5 text-primary" />
              </div>
              Upload Lesson
            </DialogTitle>
          </DialogHeader>
        )}

        <AnimatePresence mode="wait">
          {uploadState === 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Tabs defaultValue="file" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="file">
                    <File className="h-4 w-4 mr-2" />
                    File
                  </TabsTrigger>
                  <TabsTrigger value="image">
                    <Image className="h-4 w-4 mr-2" />
                    Image
                  </TabsTrigger>
                  <TabsTrigger value="text">
                    <Type className="h-4 w-4 mr-2" />
                    Text
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="file" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="file-title">Lesson Title</Label>
                      <Input
                        id="file-title"
                        type="text"
                        placeholder="e.g., Introduction to React Hooks"
                        value={lessonTitle}
                        onChange={(e) => setLessonTitle(e.target.value)}
                      />
                    </div>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
                        isDragging
                          ? 'border-primary bg-primary/5 scale-105'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }`}
                    >
                      <Upload className={`h-12 w-12 mx-auto mb-4 ${
                        isDragging ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                      <h3 className="mb-2">
                        {isDragging ? 'Drop file here' : selectedFile ? selectedFile.name : 'Drag and drop your file'}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        or click to browse
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.ppt,.pptx"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                      />
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Select File
                      </Button>
                      <p className="text-xs text-muted-foreground mt-4">
                        Supported: PDF, DOC, DOCX, PPTX (max 10MB)
                      </p>
                    </div>
                    {selectedFile && (
                      <Button
                        onClick={uploadFileToBackend}
                        disabled={!lessonTitle.trim() || uploadState === 'uploading'}
                        className="w-full"
                      >
                        {uploadState === 'uploading' ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          'Upload File'
                        )}
                      </Button>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="image" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="image-title">Lesson Title</Label>
                      <Input
                        id="image-title"
                        type="text"
                        placeholder="e.g., Introduction to React Hooks"
                        value={lessonTitle}
                        onChange={(e) => setLessonTitle(e.target.value)}
                      />
                    </div>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
                        isDragging
                          ? 'border-secondary bg-secondary/5 scale-105'
                          : 'border-border hover:border-secondary/50 hover:bg-muted/50'
                      }`}
                    >
                      <Image className={`h-12 w-12 mx-auto mb-4 ${
                        isDragging ? 'text-secondary' : 'text-muted-foreground'
                      }`} />
                      <h3 className="mb-2">
                        {isDragging ? 'Drop image here' : selectedFile ? selectedFile.name : 'Upload an image'}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        We'll extract text using OCR
                      </p>
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                      />
                      <Button
                        variant="outline"
                        onClick={() => imageInputRef.current?.click()}
                      >
                        Select Image
                      </Button>
                      <p className="text-xs text-muted-foreground mt-4">
                        Supported: PNG, JPG (max 10MB)
                      </p>
                    </div>
                    {selectedFile && (
                      <Button
                        onClick={uploadFileToBackend}
                        disabled={!lessonTitle.trim() || uploadState === 'uploading'}
                        className="w-full"
                      >
                        {uploadState === 'uploading' ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          'Upload Image'
                        )}
                      </Button>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="text" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Lesson Title</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Introduction to React Hooks"
                        value={lessonTitle}
                        onChange={(e) => setLessonTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="content">Lesson Content</Label>
                      <Textarea
                        id="content"
                        placeholder="Lesson content..."
                        className="min-h-[200px] resize-none"
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={handleTextUpload}
                      disabled={!textContent.trim() || !lessonTitle.trim() || uploadState === 'uploading'}
                      className="w-full"
                    >
                      {uploadState === 'uploading' ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        'Upload Text Content'
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}

          {(uploadState === 'uploading' || uploadState === 'processing') && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-8 space-y-6"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Loader2 className="h-6 w-6 text-primary animate-spin" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-1">
                    {uploadState === 'uploading' ? 'Uploading your lesson...' : 'Processing...'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {fileName || lessonTitle}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {uploadState === 'uploading' ? 'Please wait...' : 'Extracting text and generating AI cards...'}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {uploadState === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 text-center space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="inline-flex p-4 rounded-full bg-success/10"
              >
                <CheckCircle2 className="h-12 w-12 text-success" />
              </motion.div>
              <div>
                <h3 className="text-xl mb-2">Upload Successful!</h3>
                <p className="text-muted-foreground">
                  Your lesson is ready. AI cards have been generated.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setUploadState('idle');
                  setLessonTitle('');
                  setTextContent('');
                  setFileName('');
                  setSelectedFile(null);
                }}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload New Lesson
              </Button>
            </motion.div>
          )}

          {uploadState === 'error' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 text-center space-y-4"
            >
              <div className="inline-flex p-4 rounded-full bg-error/10">
                <AlertCircle className="h-12 w-12 text-error" />
              </div>
              <div>
                <h3 className="text-xl mb-2">Upload Failed</h3>
                <p className="text-muted-foreground">
                  Something went wrong. Please try again.
                </p>
              </div>
              <Button onClick={() => setUploadState('idle')}>
                Try Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
