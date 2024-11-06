import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart3, CheckCircle2, Target } from 'lucide-react';

interface CategoryScore {
  category: string;
  questions: string[];
  descriptions: Array<{
    weak: string;
    mid: string;
    strong: string;
  }>;
  scores: number[];
  averageScore: number;
}

interface AssessmentSummaryProps {
  name: string;
  companyName: string;
  answers: number[];
  questions: {
    category: string;
    questions: string[];
    descriptions: Array<{
      weak: string;
      mid: string;
      strong: string;
    }>;
  }[];
}

export function AssessmentSummary({ name, companyName, answers, questions }: AssessmentSummaryProps) {
  const calculateCategoryScores = (): CategoryScore[] => {
    let answerIndex = 0;
    return questions.map((category) => {
      const categoryScores = answers.slice(answerIndex, answerIndex + category.questions.length);
      const averageScore = categoryScores.reduce((a, b) => a + b, 0) / categoryScores.length;
      answerIndex += category.questions.length;

      return {
        category: category.category,
        questions: category.questions,
        descriptions: category.descriptions,
        scores: categoryScores,
        averageScore,
      };
    });
  };

  const categoryScores = calculateCategoryScores();
  const overallAverage = answers.reduce((a, b) => a + b, 0) / answers.length;

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (score: number) => {
    if (score >= 8) return 'bg-green-600';
    if (score >= 4) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const getPerformanceLevel = (score: number) => {
    if (score <= 3) return 'weak';
    if (score <= 7) return 'mid';
    return 'strong';
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-6 h-6" />
            Assessment Summary for {companyName}
          </CardTitle>
          <p className="text-muted-foreground">Completed by {name}</p>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Overall Score
              </h3>
              <span className={`text-2xl font-bold ${getScoreColor(overallAverage)}`}>
                {overallAverage.toFixed(1)}/10
              </span>
            </div>
            <Progress 
              value={overallAverage * 10} 
              className={`h-2 ${getProgressColor(overallAverage)}`} 
            />
          </div>
        </CardContent>
      </Card>

      {categoryScores.map((category, index) => (
        <Card key={index} className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                {category.category}
              </CardTitle>
              <span className={`text-xl font-bold ${getScoreColor(category.averageScore)}`}>
                {category.averageScore.toFixed(1)}/10
              </span>
            </div>
            <Progress 
              value={category.averageScore * 10} 
              className={`h-2 ${getProgressColor(category.averageScore)}`} 
            />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {category.questions.map((question, qIndex) => {
                const score = category.scores[qIndex];
                const level = getPerformanceLevel(score);
                const description = category.descriptions[qIndex][level];
                return (
                  <div key={qIndex} className="space-y-2">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{question}</p>
                        <p className="text-sm text-muted-foreground italic mt-1">{description}</p>
                      </div>
                      <span className={`font-medium ${getScoreColor(score)}`}>
                        {score}/10
                      </span>
                    </div>
                    <Progress 
                      value={score * 10} 
                      className={`h-1.5 ${getProgressColor(score)}`} 
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}