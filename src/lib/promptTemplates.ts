export function buildATSKeywordsPrompt(jobDescription: string, resumeContent: string) {
  return `You are an expert ATS (Applicant Tracking System) optimization consultant and career advisor.

Your task is to analyze the job description and the candidate's resume to help optimize the resume for better ATS compatibility.

Follow these steps:
1. Read the job description carefully and extract the most relevant keywords, skills, technical terms, and requirements that reflect what the employer is looking for.
2. Analyze the resume content and identify which important terms or phrases are present.
3. Compare the job requirements with the resume content to find missing or underrepresented keywords.
4. Identify specific keywords, skills, and phrases that should be added or emphasized in the resume to improve ATS match score.
5. Provide actionable recommendations for improving the resume's ATS compatibility.

Return your analysis in the following JSON format:
{
  "missingKeywords": ["keyword1", "keyword2", "keyword3"],
  "weakKeywords": ["keyword4", "keyword5"],
  "presentKeywords": ["keyword6", "keyword7"],
  "summary": "A concise explanation of how the resume can be improved for better ATS compatibility, including specific recommendations for emphasis and additions."
}

Job Description:
${jobDescription}

Resume Content:
${resumeContent}`;
}

