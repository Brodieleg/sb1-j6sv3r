export const generateMarkdownSummary = (name: string, companyName: string, answers: number[], questions: any[]) => {
  const overallScore = answers.reduce((a, b) => a + b, 0) / answers.length;
  
  let markdown = `# Assessment Summary\n\n`;
  markdown += `## Personal Information\n`;
  markdown += `- **Name:** ${name}\n`;
  markdown += `- **Company:** ${companyName}\n\n`;
  markdown += `## Overall Score: ${overallScore.toFixed(2)}/10\n\n`;
  
  let answerIndex = 0;
  questions.forEach((category) => {
    const categoryAnswers = answers.slice(answerIndex, answerIndex + category.questions.length);
    const averageScore = categoryAnswers.reduce((a, b) => a + b, 0) / categoryAnswers.length;
    
    markdown += `### ${category.category}\n`;
    markdown += `**Average Score:** ${averageScore.toFixed(2)}/10\n\n`;
    markdown += `#### Responses:\n`;
    category.questions.forEach((question: string, questionIndex: number) => {
      const score = categoryAnswers[questionIndex];
      const level = score <= 3 ? 'weak' : score <= 7 ? 'mid' : 'strong';
      const description = category.descriptions[questionIndex][level];
      
      markdown += `- **Q:** ${question}\n`;
      markdown += `  **Score:** ${score}/10\n`;
      markdown += `  **Performance Level:** ${level.charAt(0).toUpperCase() + level.slice(1)}\n`;
      markdown += `  **Description:** ${description}\n\n`;
    });
    answerIndex += category.questions.length;
  });
  
  return markdown;
};