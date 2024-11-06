import { useState } from 'react';
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { AssessmentSummary } from './AssessmentSummary';
import { questions } from './questions';
import { generateMarkdownSummary } from './utils';
import { ClipboardCheck, ArrowRight, Download, RefreshCw, CheckCircle2, AlertTriangle, MinusCircle, CheckCircle } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

const PerformanceIndicator = ({ level, score }: { level: string; score: string }) => {
  const getIcon = () => {
    switch (level.toLowerCase()) {
      case 'weak':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'mid':
        return <MinusCircle className="w-4 h-4 text-yellow-500" />;
      case 'strong':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getBgColor = () => {
    switch (level.toLowerCase()) {
      case 'weak':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'mid':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'strong':
        return 'bg-green-50 border-green-200 text-green-700';
      default:
        return '';
    }
  };

  return (
    <div className={`flex items-center gap-2 p-2 rounded-md border ${getBgColor()}`}>
      {getIcon()}
      <div className="flex items-center gap-1">
        <span className="font-medium">{level}</span>
        <span className="text-sm opacity-75">({score})</span>
      </div>
    </div>
  );
};

export function Assessment() {
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [currentCategory, setCurrentCategory] = useState(-1);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState(5);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [webhookResponse, setWebhookResponse] = useState<string | null>(null);
  const [markdownSummary, setMarkdownSummary] = useState<string>('');

  const totalQuestions = questions.reduce((acc, category) => acc + category.questions.length, 0);
  const progress = ((answers.length + (currentCategory === -1 ? 0 : 1)) / totalQuestions) * 100;

  const resetQuiz = () => {
    setName('');
    setCompanyName('');
    setCurrentCategory(-1);
    setCurrentQuestion(0);
    setAnswers([]);
    setCurrentAnswer(5);
    setIsVerifying(false);
    setIsSubmitted(false);
    setIsSubmitting(false);
    setError(null);
    setWebhookResponse(null);
    setMarkdownSummary('');
  };

  const handleNext = () => {
    if (currentCategory === -1) {
      if (name && companyName) {
        setCurrentCategory(0);
        setError(null);
      } else {
        setError('Please enter both your name and company name.');
        return;
      }
    } else if (answers.length === totalQuestions - 1) {
      const finalAnswers = [...answers, currentAnswer];
      setAnswers(finalAnswers);
      setIsVerifying(true);
    } else {
      setAnswers([...answers, currentAnswer]);
      if (currentQuestion < questions[currentCategory].questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else if (currentCategory < questions.length - 1) {
        setCurrentCategory(currentCategory + 1);
        setCurrentQuestion(0);
      }
      setCurrentAnswer(5);
    }
  };

  const handleSliderChange = (value: number[]) => {
    setCurrentAnswer(value[0]);
  };

  const handleVerifyChange = (index: number, value: number) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    setWebhookResponse(null);
    const webhookUrl = 'https://hook.eu2.make.com/toidccm8lkquey8vt34nv6n5zekcrxyp';

    try {
      const markdown = generateMarkdownSummary(name, companyName, answers, questions);
      setMarkdownSummary(markdown);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/markdown',
        },
        body: markdown,
      });

      const responseData = await response.text();
      setWebhookResponse(responseData);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setIsSubmitted(true);
    } catch (error) {
      setError(`Failed to submit assessment: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([markdownSummary], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'assessment-results.md';
    link.href = url;
    link.click();
  };

  const getPerformanceLevel = (score: number) => {
    if (score <= 3) return 'weak';
    if (score <= 7) return 'mid';
    return 'strong';
  };

  const chartData = {
    labels: questions.flatMap(category =>
      category.questions.map((_, index) => `${category.category} Q${index + 1}`)
    ),
    datasets: [{
      label: 'Answers',
      data: answers,
      backgroundColor: 'rgba(75, 192, 192, 0.6)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1
    }]
  };

  const chartOptions = {
    responsive: true,
    indexAxis: 'y' as const,
    scales: {
      x: {
        beginAtZero: true,
        max: 10,
        title: {
          display: true,
          text: 'Score'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Questions'
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Assessment Results'
      }
    }
  };

  if (isSubmitted) {
    return (
      <div className="space-y-8">
        <Card className="w-full max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              Assessment Complete
            </CardTitle>
            <CardDescription>
              Thank you for completing the assessment, {name} from {companyName}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {webhookResponse && (
              <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-md">
                <p className="font-medium">Success!</p>
                <p className="text-sm">Your assessment has been successfully submitted.</p>
              </div>
            )}
            <div className="w-full h-[800px] mb-6">
              <Bar data={chartData} options={chartOptions} />
            </div>
            <div className="mt-6">
              <h3 className="font-semibold text-lg mb-2">Assessment Summary</h3>
              <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
                <pre className="whitespace-pre-wrap font-mono text-sm">
                  {markdownSummary}
                </pre>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button onClick={handleDownload} variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download Summary
            </Button>
            <Button onClick={resetQuiz} className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Start New Assessment
            </Button>
          </CardFooter>
        </Card>

        <div className="w-full max-w-3xl mx-auto">
          <AssessmentSummary
            name={name}
            companyName={companyName}
            answers={answers}
            questions={questions}
          />
        </div>
      </div>
    );
  }

  if (isVerifying) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6" />
            Verify Your Answers
          </CardTitle>
          <CardDescription>
            Please review your answers, {name} from {companyName}. You can make changes if needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {questions.map((category, categoryIndex) => (
              <div key={category.category} className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  {category.category}
                </h3>
                {category.questions.map((question, questionIndex) => {
                  const answerIndex = categoryIndex * category.questions.length + questionIndex;
                  const level = getPerformanceLevel(answers[answerIndex]);
                  const description = category.descriptions[questionIndex][level];
                  return (
                    <div key={question} className="space-y-2 bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium">{question}</p>
                      <div className={`p-3 rounded-md ${
                        level === 'weak' ? 'bg-red-50 border border-red-100' :
                        level === 'mid' ? 'bg-yellow-50 border border-yellow-100' :
                        'bg-green-50 border border-green-100'
                      }`}>
                        <p className="text-sm italic">{description}</p>
                      </div>
                      <Slider
                        min={0}
                        max={10}
                        step={1}
                        value={[answers[answerIndex]]}
                        onValueChange={(value) => handleVerifyChange(answerIndex, value[0])}
                        className="my-4"
                      />
                      <div className="flex justify-between gap-2">
                        <PerformanceIndicator level="Weak" score="0-3" />
                        <PerformanceIndicator level="Mid" score="4-7" />
                        <PerformanceIndicator level="Strong" score="8-10" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Submit Assessment
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (currentCategory === -1) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Welcome to the Assessment</CardTitle>
          <CardDescription>
            This assessment will help evaluate various aspects of your organization.
            Please enter your details to begin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter your company name"
                className="w-full"
              />
            </div>
          </div>
          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleNext} className="flex items-center gap-2">
            Start Assessment
            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const currentDescription = questions[currentCategory].descriptions[currentQuestion][getPerformanceLevel(currentAnswer)];
  const currentLevel = getPerformanceLevel(currentAnswer);

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle>{questions[currentCategory].category}</CardTitle>
          <span className="text-sm text-muted-foreground">
            Question {answers.length + 1} of {totalQuestions}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-xl font-medium">
          {questions[currentCategory].questions[currentQuestion]}
        </p>
        <div className={`p-4 rounded-md mb-8 ${
          currentLevel === 'weak' ? 'bg-red-50 border border-red-100' :
          currentLevel === 'mid' ? 'bg-yellow-50 border border-yellow-100' :
          'bg-green-50 border border-green-100'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {currentLevel === 'weak' && <AlertTriangle className="w-4 h-4 text-red-500" />}
            {currentLevel === 'mid' && <MinusCircle className="w-4 h-4 text-yellow-500" />}
            {currentLevel === 'strong' && <CheckCircle className="w-4 h-4 text-green-500" />}
            <span className="font-medium capitalize">{currentLevel} Performance</span>
          </div>
          <p className="text-sm italic">{currentDescription}</p>
        </div>
        <div className="space-y-6">
          <Slider
            min={0}
            max={10}
            step={1}
            value={[currentAnswer]}
            onValueChange={handleSliderChange}
            className="my-6"
          />
          <div className="flex justify-between gap-2">
            <PerformanceIndicator level="Weak" score="0-3" />
            <PerformanceIndicator level="Mid" score="4-7" />
            <PerformanceIndicator level="Strong" score="8-10" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Score: {currentAnswer}/10
        </div>
        <Button onClick={handleNext} className="flex items-center gap-2">
          {answers.length === totalQuestions - 1 ? (
            <>
              Review Answers
              <ClipboardCheck className="w-4 h-4" />
            </>
          ) : (
            <>
              Next Question
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}