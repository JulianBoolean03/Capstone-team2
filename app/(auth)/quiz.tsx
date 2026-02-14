import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { completeCurrentUserQuiz, useDummyAuth } from '@/lib/dummy-auth';

const ACCENT = '#3B5BFF';
const SURFACE = '#FFFFFF';
const INK = '#101126';
const MUTED = '#6B7280';
const BORDER = '#E6E8F0';

type Option = { key: string; label: string };

type Question = {
  id: string;
  title: string;
  options: Option[];
};

const QUESTIONS: Question[] = [
  {
    id: 'q1',
    title: '1. When do you study best?',
    options: [
      { key: 'A', label: 'Morning' },
      { key: 'B', label: 'Afternoon' },
      { key: 'C', label: 'Evening' },
      { key: 'D', label: 'Late night' },
      { key: 'E', label: 'Varies a lot' },
    ],
  },
  {
    id: 'q2',
    title: '2. Where do you focus best?',
    options: [
      { key: 'A', label: 'Quiet library' },
      { key: 'B', label: 'Coffee shop' },
      { key: 'C', label: 'Bedroom' },
      { key: 'D', label: 'Outdoors' },
      { key: 'E', label: 'Anywhere' },
    ],
  },
  {
    id: 'q3',
    title: '3. How do you prefer your study sessions?',
    options: [
      { key: 'A', label: 'Short bursts (15-30 min)' },
      { key: 'B', label: 'Medium (45-60 min)' },
      { key: 'C', label: 'Long (90+ min)' },
      { key: 'D', label: 'Depends' },
    ],
  },
  {
    id: 'q4',
    title: '4. How structured are you with studying?',
    options: [
      { key: '1', label: '1 - Spontaneous' },
      { key: '2', label: '2 - Somewhat spontaneous' },
      { key: '3', label: '3 - Balanced' },
      { key: '4', label: '4 - Somewhat scheduled' },
      { key: '5', label: '5 - Strict schedule' },
    ],
  },
  {
    id: 'q5',
    title: '5. What’s your ideal vibe while studying?',
    options: [
      { key: 'A', label: 'Dead silent' },
      { key: 'B', label: 'Low background noise' },
      { key: 'C', label: 'Music' },
      { key: 'D', label: 'Talking is fine' },
      { key: 'E', label: 'Depends' },
    ],
  },
  {
    id: 'q6',
    title: '6. How often do you procrastinate when studying?',
    options: [
      { key: 'A', label: 'Almost never' },
      { key: 'B', label: 'Sometimes' },
      { key: 'C', label: 'Often' },
      { key: 'D', label: 'Very often' },
    ],
  },
  {
    id: 'q7',
    title: '7. When studying with others, you prefer:',
    options: [
      { key: 'A', label: 'Quiet co-study (same room, little talking)' },
      { key: 'B', label: 'Discuss and teach each other' },
      { key: 'C', label: 'Alternating quiet and check-ins' },
      { key: 'D', label: 'I prefer solo studying' },
    ],
  },
  {
    id: 'q8',
    title: '8. How talkative do you want a study partner to be?',
    options: [
      { key: '1', label: '1 - I barely talk' },
      { key: '2', label: '2 - Low interaction' },
      { key: '3', label: '3 - Balanced' },
      { key: '4', label: '4 - Talkative' },
      { key: '5', label: '5 - Very interactive' },
    ],
  },
  {
    id: 'q9',
    title: '9. If you’re stuck on something, you usually:',
    options: [
      { key: 'A', label: 'Ask immediately' },
      { key: 'B', label: 'Try alone first, then ask' },
      { key: 'C', label: 'Look it up or figure it out' },
      { key: 'D', label: 'Avoid asking unless necessary' },
    ],
  },
  {
    id: 'q10',
    title: '10. In a group, what role do you naturally take?',
    options: [
      { key: 'A', label: 'Leader/organizer' },
      { key: 'B', label: 'Explainer/teacher' },
      { key: 'C', label: 'Quiet grinder' },
      { key: 'D', label: 'Motivator/hype' },
      { key: 'E', label: 'I adapt to the group' },
    ],
  },
  {
    id: 'q11',
    title: '11. How comfortable are you with friendly accountability (check-ins, reminders)?',
    options: [
      { key: 'A', label: 'Love it' },
      { key: 'B', label: 'It’s helpful' },
      { key: 'C', label: 'Neutral' },
      { key: 'D', label: 'Don’t like it' },
    ],
  },
  {
    id: 'q12',
    title: '12. What’s your preferred communication style for study sessions?',
    options: [
      { key: 'A', label: 'In-person' },
      { key: 'B', label: 'Voice call' },
      { key: 'C', label: 'Video call' },
      { key: 'D', label: 'Text only' },
      { key: 'E', label: 'No preference' },
    ],
  },
  {
    id: 'q13',
    title: '13. What motivates you most?',
    options: [
      { key: 'A', label: 'Clear goals and deadlines' },
      { key: 'B', label: 'Competition (leaderboards, challenges)' },
      { key: 'C', label: 'Curiosity/interest' },
      { key: 'D', label: 'Fear of failing' },
      { key: 'E', label: 'Helping others / being part of a team' },
    ],
  },
  {
    id: 'q14',
    title: '14. How do you handle stress near exams?',
    options: [
      { key: 'A', label: 'I lock in and grind harder' },
      { key: 'B', label: 'I get anxious but still function' },
      { key: 'C', label: 'I freeze/procrastinate' },
      { key: 'D', label: 'It varies' },
    ],
  },
  {
    id: 'q15',
    title: '15. How intense do you want study sessions to feel?',
    options: [
      { key: 'A', label: 'Chill' },
      { key: 'B', label: 'Balanced' },
      { key: 'C', label: 'High intensity' },
      { key: 'D', label: 'Depends on the week' },
    ],
  },
  {
    id: 'q16',
    title: '16. How do you feel about being corrected or challenged?',
    options: [
      { key: 'A', label: 'I like direct feedback' },
      { key: 'B', label: 'Be gentle about it' },
      { key: 'C', label: 'Only if I ask' },
      { key: 'D', label: 'I don’t like being corrected' },
    ],
  },
  {
    id: 'q17',
    title: '17. Which study method works best for you?',
    options: [
      { key: 'A', label: 'Practice problems' },
      { key: 'B', label: 'Flashcards/spaced repetition' },
      { key: 'C', label: 'Reading and notes' },
      { key: 'D', label: 'Videos' },
      { key: 'E', label: 'Teaching/explaining out loud' },
    ],
  },
  {
    id: 'q18',
    title: '18. When you learn something new, you prefer:',
    options: [
      { key: 'A', label: 'Big-picture first, then details' },
      { key: 'B', label: 'Details first, then big-picture' },
      { key: 'C', label: 'Example first' },
      { key: 'D', label: 'Depends' },
    ],
  },
  {
    id: 'q19',
    title: '19. How do you take notes?',
    options: [
      { key: 'A', label: 'Very detailed' },
      { key: 'B', label: 'Minimal bullet points' },
      { key: 'C', label: 'Mostly mental / no notes' },
      { key: 'D', label: 'I rewrite/organize later' },
    ],
  },
  {
    id: 'q20',
    title: '20. Pick the statement that fits you best:',
    options: [
      { key: 'A', label: 'I’m consistent even if it’s boring' },
      { key: 'B', label: 'I sprint hard when deadlines are close' },
      { key: 'C', label: 'I’m best when someone studies with me' },
      { key: 'D', label: 'I’m best alone with no distractions' },
      { key: 'E', label: 'I’m inconsistent but smart when I lock in' },
    ],
  },
];

export default function QuizScreen() {
  const router = useRouter();
  const currentUser = useDummyAuth();
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const allAnswered = answeredCount === QUESTIONS.length;

  useEffect(() => {
    if (!currentUser) {
      router.replace('/login');
      return;
    }

    if (currentUser.quizCompleted) {
      router.replace('/(tabs)');
    }
  }, [currentUser, router]);

  const handleSelect = (questionId: string, optionKey: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionKey }));
  };

  const handleFinish = () => {
    if (!allAnswered) {
      return;
    }

    completeCurrentUserQuiz(answers);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Study Partner Quiz</Text>
        <Text style={styles.subtitle}>
          Answer a few questions so we can match you with the right study partners.
        </Text>
        <View style={styles.progress}>
          <View style={[styles.progressFill, { width: `${(answeredCount / QUESTIONS.length) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {answeredCount} of {QUESTIONS.length} answered
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {QUESTIONS.map((question) => (
          <View key={question.id} style={styles.card}>
            <Text style={styles.question}>{question.title}</Text>
            {question.options.map((option) => {
              const isSelected = answers[question.id] === option.key;
              return (
                <Pressable
                  key={option.key}
                  style={[styles.option, isSelected && styles.optionSelected]}
                  onPress={() => handleSelect(question.id, option.key)}
                >
                  <View style={[styles.radio, isSelected && styles.radioSelected]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {option.key}. {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
        <Pressable
          style={[styles.primaryButton, !allAnswered && styles.primaryButtonDisabled]}
          onPress={handleFinish}
          disabled={!allAnswered}
        >
          <Text style={styles.primaryText}>Finish Quiz</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#EEF2FF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: INK,
  },
  subtitle: {
    fontSize: 12.5,
    color: MUTED,
    marginTop: 6,
  },
  progress: {
    height: 6,
    backgroundColor: '#DDE2F5',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: ACCENT,
  },
  progressText: {
    fontSize: 11,
    color: MUTED,
    marginTop: 6,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: SURFACE,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 14,
    shadowColor: '#1F2A55',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  question: {
    fontSize: 13.5,
    fontWeight: '700',
    color: INK,
    marginBottom: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  optionSelected: {
    backgroundColor: '#EEF2FF',
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#CBD5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: ACCENT,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ACCENT,
  },
  optionText: {
    fontSize: 12.5,
    color: INK,
  },
  optionTextSelected: {
    color: ACCENT,
    fontWeight: '600',
  },
  primaryButton: {
    marginTop: 10,
    backgroundColor: '#0B0F26',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
