import { useState, useEffect } from 'react';
import { Calendar, Download, TrendingUp, Award, Clock, Target } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { mockProgressData, mockLessons, mockStudySessions } from '../../../lib/mock-data';
import { lessonApi, type ProgressSummary } from '../../../lib/api';
import { type APILesson } from '../../../lib/lessons-cache';

export function Progress() {
  const [dateRange, setDateRange] = useState('7');
  const [progressSummary, setProgressSummary] = useState<ProgressSummary | null>(null);
  const [lessons, setLessons] = useState<APILesson[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const userId = localStorage.getItem('userId');
      if (userId) {
        try {
          // Fetch progress summary
          const summary = await lessonApi.getProgressSummary(parseInt(userId));
          setProgressSummary(summary);

          // Fetch lessons (which now includes lastReviewed)
          const lessonsResponse = await fetch(`http://localhost:8080/api/lessons?userId=${userId}`);
          if (lessonsResponse.ok) {
            const lessonsData = await lessonsResponse.json();
            setLessons(lessonsData);
          }
        } catch (error) {
          console.error('Error fetching progress data:', error);
        }
      }
    };

    fetchData();
  }, []);

  const totalStudied = progressSummary?.totalLessons || mockProgressData.reduce((acc, d) => acc + d.cardsStudied, 0);
  const totalMastered = progressSummary?.masteredLessons || mockProgressData.reduce((acc, d) => acc + d.cardsMastered, 0);
  const avgAccuracy = progressSummary?.averageMastery || (totalStudied > 0 ? Math.round((totalMastered / totalStudied) * 100) : 0);
  const studyStreak = progressSummary?.streakDays || 7; // Mock streak

  // Calculate chart data based on date range
  const calculateChartData = () => {
    const days = parseInt(dateRange);
    const now = new Date();
    const chartData: { date: string; lessonsUploaded: number; mastered: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dateString = date.toISOString().split('T')[0];
      
      // Count lessons uploaded on this date
      const uploaded = lessons.filter(lesson => {
        const uploadDate = new Date(lesson.uploadedAt);
        uploadDate.setHours(0, 0, 0, 0);
        return uploadDate.toISOString().split('T')[0] === dateString;
      }).length;

      // Count lessons mastered on this date (progress = 100 and lastReviewed on this date)
      const mastered = lessons.filter(lesson => {
        if (lesson.progress === 100 && lesson.lastReviewed) {
          const reviewDate = new Date(lesson.lastReviewed);
          reviewDate.setHours(0, 0, 0, 0);
          return reviewDate.toISOString().split('T')[0] === dateString;
        }
        return false;
      }).length;

      chartData.push({
        date: date.toISOString(),
        lessonsUploaded: uploaded,
        mastered: mastered
      });
    }

    return chartData;
  };

  const chartData = calculateChartData();

  const lessonProgressData = lessons
    .filter(l => l.extractedContent && l.progress && l.progress > 0)
    .map(lesson => ({
      name: lesson.title.length > 20 ? lesson.title.substring(0, 20) + '...' : lesson.title,
      progress: lesson.progress || 0
    }));

  // Calculate mastery data from real lessons
  const notStarted = lessons.filter(l => (!l.progress || l.progress === 0) && !l.lastReviewed).length;
  const inProgress = lessons.filter(l => l.progress && l.progress > 0 && l.progress < 100 && l.lastReviewed).length;
  const mastered = lessons.filter(l => l.progress === 100 && l.lastReviewed).length;

  const masteryData = [
    { name: 'Mastered', value: mastered, color: '#10b981' },
    { name: 'Progress', value: inProgress, color: '#f59e0b' },
    { name: 'Not Started', value: notStarted, color: '#94a3b8' }
  ].filter(item => item.value > 0); // Only show categories with data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Your Progress</h1>
          <p className="text-muted-foreground">Track your learning journey and achievements</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          {/* <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button> */}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-2xl font-semibold">{totalStudied}</span>
          </div>
          <p className="text-sm text-muted-foreground">Cards Uploaded</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Award className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-2xl font-semibold">{totalMastered}</span>
          </div>
          <p className="text-sm text-muted-foreground">Cards Mastered</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-2xl font-semibold">{avgAccuracy}%</span>
          </div>
          <p className="text-sm text-muted-foreground">Average Mastery</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <span className="text-2xl font-semibold">{studyStreak}</span>
          </div>
          <p className="text-sm text-muted-foreground">Day Streak</p>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="lessons">By Lesson</TabsTrigger>
          <TabsTrigger value="mastery">Mastery</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="p-6">
            <h3 className="mb-4">Study Activity</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                <YAxis />
                <Tooltip labelFormatter={(date) => new Date(date).toLocaleDateString()} />
                <Legend />
                <Line type="monotone" dataKey="lessonsUploaded" stroke="#3b82f6" name="Lessons Uploaded" strokeWidth={2} />
                <Line type="monotone" dataKey="mastered" stroke="#10b981" name="Mastered" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="lessons" className="space-y-4">
          <Card className="p-6">
            <h3 className="mb-4">Progress by Lesson</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={lessonProgressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="progress" fill="#3b82f6" name="Progress %" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="mastery" className="space-y-4">
          <Card className="p-6">
            <h3 className="mb-4">Mastery Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={masteryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {masteryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Sessions */}
      <Card className="p-6">
        <h3 className="mb-4">Recent Study Sessions</h3>
        <div className="space-y-4">
          {lessons
            .filter(lesson => lesson.progress && lesson.progress > 0 && lesson.lastReviewed)
            .sort((a, b) => new Date(b.lastReviewed!).getTime() - new Date(a.lastReviewed!).getTime())
            .slice(0, 10)
            .map((lesson) => {
              const isMastered = lesson.progress === 100;
              
              return (
                <div key={lesson.id} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{lesson.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(lesson.lastReviewed!).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-semibold ${isMastered ? 'text-green-600' : 'text-blue-600'}`}>
                      {isMastered ? 'Mastered' : 'Progress'}
                    </p>
                  </div>
                </div>
              );
            })}
          {lessons.filter(l => l.progress && l.progress > 0 && l.lastReviewed).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No study sessions yet. Complete a quiz to see your progress!</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
