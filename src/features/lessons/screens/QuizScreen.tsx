import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from '../../../web/dom';

import type { ScreenProps } from '../../../navigation/routes';
import { getChapterById } from '../data/lessonData';
import { useGamificationStore } from '../../gamification/store/gamificationStore';

export default function QuizScreen({ route, navigation }: ScreenProps<'Quiz'>) {
  const { chapterId, nextChapterId } = route.params;

  const result = getChapterById(chapterId);
  const completeChapter = useGamificationStore((state) => state.completeChapter);
  const completedChapters = useGamificationStore((state) => state.completedChapters);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);

  const chapter = result?.chapter;
  const quiz = chapter?.quiz ?? [];

  const currentQuestion = quiz[questionIndex];

  const score = useMemo(() => {
    return quiz.reduce((total, question, index) => {
      return total + (selectedIndexes[index] === question.correctAnswerIndex ? 1 : 0);
    }, 0);
  }, [quiz, selectedIndexes]);

  if (!chapter || !currentQuestion) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Quiz not found.</Text>
      </View>
    );
  }

  const selectedIndex = selectedIndexes[questionIndex];

  const handleSelect = (index: number) => {
    const copy = [...selectedIndexes];
    copy[questionIndex] = index;
    setSelectedIndexes(copy);
  };

  const handleNext = () => {
    if (selectedIndex === undefined) {
      Alert.alert('Choose one answer', 'Please select an answer first.');
      return;
    }

    if (questionIndex < quiz.length - 1) {
      setQuestionIndex((value) => value + 1);
      return;
    }

    setFinished(true);

    const finalScore = quiz.reduce((total, question, index) => {
      return total + (selectedIndexes[index] === question.correctAnswerIndex ? 1 : 0);
    }, 0);

    if (finalScore >= chapter.passingScore) {
      completeChapter({
        chapterId: chapter.chapterId,
        nextChapterId,
        starsEarned: chapter.starsReward,
        quizScore: finalScore,
      });
    }
  };

  if (finished) {
    const passed = score >= chapter.passingScore;
    const alreadyCompleted = Boolean(completedChapters[chapterId]);

    return (
      <View style={styles.container}>
        <View style={styles.resultCard}>
          <Text style={styles.resultEmoji}>{passed ? '🎉' : '💪'}</Text>
          <Text style={styles.resultTitle}>{passed ? 'Great job!' : 'Try again!'}</Text>
          <Text style={styles.resultText}>
            Your score: {score}/{quiz.length}
          </Text>

          {passed ? (
            <Text style={styles.rewardText}>
              {alreadyCompleted
                ? 'This chapter is completed. Stars are not duplicated.'
                : `You earned ⭐ ${chapter.starsReward}`}
            </Text>
          ) : (
            <Text style={styles.resultText}>
              Passing score is {chapter.passingScore}/{quiz.length}.
            </Text>
          )}

          <Pressable
            style={styles.primaryButton}
            onPress={() => navigation.popToTop()}
          >
            <Text style={styles.primaryButtonText}>Back to Home</Text>
          </Pressable>

          {!passed ? (
            <Pressable
              style={styles.secondaryButton}
              onPress={() => {
                setQuestionIndex(0);
                setSelectedIndexes([]);
                setFinished(false);
              }}
            >
              <Text style={styles.secondaryButtonText}>Retry Quiz</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.progress}>
        Question {questionIndex + 1} of {quiz.length}
      </Text>

      <Text style={styles.question}>{currentQuestion.question}</Text>

      {currentQuestion.options.map((option, index) => (
        <Pressable
          key={option}
          style={[
            styles.option,
            selectedIndex === index && styles.selectedOption,
          ]}
          onPress={() => handleSelect(index)}
        >
          <Text
            style={[
              styles.optionText,
              selectedIndex === index && styles.selectedOptionText,
            ]}
          >
            {option}
          </Text>
        </Pressable>
      ))}

      <Pressable style={styles.primaryButton} onPress={handleNext}>
        <Text style={styles.primaryButtonText}>
          {questionIndex < quiz.length - 1 ? 'Next' : 'Finish Quiz'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progress: {
    color: '#64748B',
    fontWeight: '700',
    marginBottom: 10,
  },
  question: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 18,
  },
  option: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  selectedOption: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  optionText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  selectedOptionText: {
    color: '#FFFFFF',
  },
  primaryButton: {
    marginTop: 12,
    backgroundColor: '#2563EB',
    padding: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  secondaryButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#2563EB',
    padding: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#2563EB',
    fontWeight: '900',
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    marginTop: 40,
  },
  resultEmoji: {
    fontSize: 56,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 10,
  },
  resultText: {
    marginTop: 8,
    color: '#64748B',
    fontSize: 16,
  },
  rewardText: {
    marginTop: 10,
    color: '#F59E0B',
    fontWeight: '900',
    fontSize: 17,
    textAlign: 'center',
  },
  errorText: {
    color: '#DC2626',
  },
});
