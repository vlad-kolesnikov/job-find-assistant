import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Upload, FileText, Sparkles } from 'lucide-react';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ATSResult {
  missingKeywords: string[];
  weakKeywords: string[];
  presentKeywords: string[];
  summary: string;
}

const ResumeBuilder = () => {
  const [jobDescription, setJobDescription] = useState('');
  const [resumeContent, setResumeContent] = useState('');
  const [result, setResult] = useState<ATSResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setLoading(true);

    try {
      if (file.name.endsWith('.txt')) {
        // Read .txt files directly
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          setResumeContent(text);
          toast.success('File uploaded successfully');
          setLoading(false);
        };
        reader.readAsText(file);
      } else if (file.name.match(/\.docx?$/i)) {
        // Parse DOCX files
        toast.info('Processing Word document...');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setResumeContent(result.value);
        toast.success('Word document processed successfully');
        setLoading(false);
      } else if (file.name.match(/\.pdf$/i)) {
        // Parse PDF files
        toast.info('Processing PDF document...');
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          fullText += pageText + '\n';
        }
        
        setResumeContent(fullText);
        toast.success('PDF processed successfully');
        setLoading(false);
      } else {
        toast.error('Unsupported file format. Please use TXT, PDF, or DOCX files');
        setUploadedFileName('');
        setLoading(false);
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Failed to process file. Please try copying the text manually.');
      setUploadedFileName('');
      setLoading(false);
    }
  }, []);

  const handleRemoveFile = useCallback(() => {
    setUploadedFileName('');
    setResumeContent('');
  }, []);

  const handleScan = async () => {
    if (!jobDescription.trim() || !resumeContent.trim()) {
      toast.error('Please provide both job description and resume content');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('ats-analyze', {
        body: { jobDescription, resumeContent },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setResult(data);
      toast.success('Analysis complete!');
    } catch (error: any) {
      console.error('ATS analysis error:', error);
      toast.error('Failed to analyze resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewSample = () => {
    setJobDescription(`Senior QA Engineer

We are looking for an experienced Senior QA Engineer to join our team. The ideal candidate will have:

Required Skills:
- 5+ years of experience in software testing
- Strong knowledge of automation testing frameworks (Selenium, Playwright, Cypress)
- Experience with API testing (Postman, REST Assured)
- Proficiency in programming languages (Java, Python, JavaScript)
- Understanding of CI/CD pipelines (Jenkins, GitLab CI)
- Experience with Agile/Scrum methodologies
- Strong SQL and database testing skills

Responsibilities:
- Design and implement automated test frameworks
- Perform manual and automated testing
- Create and maintain test documentation
- Collaborate with development teams
- Mentor junior QA engineers`);

    setResumeContent(`Vlad Kolesnikov
Senior QA Engineer

Experience:
- 4 years of experience in software quality assurance
- Worked with Selenium for test automation
- Manual testing of web applications
- Bug tracking using Jira
- Basic knowledge of SQL

Skills:
- Testing web applications
- Writing test cases
- Bug reporting
- Team collaboration`);

    toast.info('Sample data loaded');
  };

  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Step 1: Upload Resume */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Step 1: Upload a resume
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={resumeContent}
              onChange={(e) => setResumeContent(e.target.value)}
              placeholder="Paste your resume content here..."
              className="min-h-[200px] resize-y"
            />
            <label className="block">
              <Button variant="outline" className="w-full" asChild>
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Resume File
                </span>
              </Button>
              <input
                type="file"
                className="hidden"
                accept=".txt,.pdf,.doc,.docx"
                onChange={handleFileUpload}
              />
            </label>
            {uploadedFileName && (
              <div className="flex items-center justify-between p-2 bg-accent rounded-md">
                <p className="text-sm font-medium">{uploadedFileName}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  className="text-xs"
                >
                  Remove
                </Button>
              </div>
            )}
            <Button
              onClick={handleScan}
              disabled={loading || !jobDescription.trim() || !resumeContent.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI Generate Keywords
                </>
              )}
            </Button>
          
          
          </CardContent>
        </Card>

        {/* Step 2: Paste Job Description */}
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Paste a job description</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Copy and paste job description here. Aim to exclude: Benefits, Perks, and Legal Disclaimers"
              className="min-h-[200px] resize-y"
            />
          </CardContent>
        </Card>
      </div>

      {/* Generated Output Section */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Output</CardTitle>
          <CardDescription>
            AI-generated keywords and analysis will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Textarea
              value={result ? `Missing Keywords: ${result.missingKeywords?.join(', ') || 'None'}\n\nWeak Keywords: ${result.weakKeywords?.join(', ') || 'None'}\n\nPresent Keywords: ${result.presentKeywords?.join(', ') || 'None'}\n\nSummary: ${result.summary || 'No summary available'}` : ''}
              readOnly
              placeholder="Click 'AI Generate Keywords' to analyze your resume..."
              className="min-h-[150px] resize-y pr-20"
            />
            {result && (
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => {
                  navigator.clipboard.writeText(`Missing Keywords: ${result.missingKeywords?.join(', ') || 'None'}\n\nWeak Keywords: ${result.weakKeywords?.join(', ') || 'None'}\n\nPresent Keywords: ${result.presentKeywords?.join(', ') || 'None'}\n\nSummary: ${result.summary || 'No summary available'}`);
                  toast.success('Copied to clipboard');
                }}
              >
                Copy
              </Button>
            )}
          </div>
        </CardContent>
      </Card>


      {/* Results */}
      {result && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{result.summary}</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Missing Keywords</CardTitle>
                <CardDescription>
                  Add these to improve your ATS score
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.missingKeywords && result.missingKeywords.length > 0 ? (
                    result.missingKeywords.map((keyword, idx) => (
                      <Badge key={idx} variant="destructive">
                        {keyword}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">None found</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Weak Keywords</CardTitle>
                <CardDescription>
                  Emphasize these more in your resume
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.weakKeywords && result.weakKeywords.length > 0 ? (
                    result.weakKeywords.map((keyword, idx) => (
                      <Badge key={idx} variant="secondary">
                        {keyword}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">None found</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Present Keywords</CardTitle>
                <CardDescription>
                  These keywords are already in your resume
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.presentKeywords && result.presentKeywords.length > 0 ? (
                    result.presentKeywords.map((keyword, idx) => (
                      <Badge key={idx} variant="default" className="bg-green-600">
                        {keyword}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">None found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeBuilder;
