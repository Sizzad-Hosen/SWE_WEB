import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  AppState,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from '../../../web/dom';

import {
  studentService,
  type PendingParentLinkRequest,
} from '../../student/services/studentService';
import { colors, shadows } from '../../../theme/theme';

type Props = {
  studentId: string;
  onLinked: () => Promise<void>;
};

export function ParentLinkRequestModal({ studentId, onLinked }: Props) {
  const [request, setRequest] = useState<PendingParentLinkRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadRequest = useCallback(async () => {
    try {
      const nextRequest =
        await studentService.getPendingParentLinkRequest(studentId);
      setRequest(nextRequest);
    } catch (error) {
      console.warn('Could not load parent link request.', error);
    }
  }, [studentId]);

  useEffect(() => {
    void loadRequest();

    const removeRealtime = studentService.subscribeToParentLinkRequests(
      studentId,
      () => void loadRequest()
    );
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void loadRequest();
      }
    });

    return () => {
      removeRealtime();
      appStateSubscription.remove();
    };
  }, [loadRequest, studentId]);

  const respond = async (accept: boolean) => {
    if (!request || submitting) {
      return;
    }

    setSubmitting(true);

    try {
      await studentService.respondToParentLink(request.id, accept);
      setRequest(null);

      if (accept) {
        await onLinked();
        Alert.alert(
          'Parent যুক্ত হয়েছে',
          'এখন Parent আপনার learning progress দেখতে এবং restore করতে পারবেন।'
        );
      }
    } catch (error) {
      Alert.alert(
        'Request সম্পন্ন হয়নি',
        error instanceof Error ? error.message : 'আবার চেষ্টা করো।'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={Boolean(request)}
      transparent
      animationType="fade"
      onRequestClose={() => undefined}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.icon}>👪</Text>
          <Text style={styles.title}>Parent Link Request</Text>
          <Text style={styles.text}>
            একজন Parent account তোমার Student ID-এর সঙ্গে যুক্ত হতে চায়।
          </Text>
          <Text style={styles.note}>
            Allow করলে Parent শুধু তোমার learning progress দেখতে পারবেন।
          </Text>

          <Pressable
            style={[styles.allow, submitting && styles.disabled]}
            onPress={() => void respond(true)}
            disabled={submitting}
          >
            <Text style={styles.allowText}>
              {submitting ? 'অপেক্ষা করো…' : 'Allow Parent'}
            </Text>
          </Pressable>
          <Pressable
            style={styles.reject}
            onPress={() => void respond(false)}
            disabled={submitting}
          >
            <Text style={styles.rejectText}>না, Reject</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.64)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    padding: 24,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    ...shadows.card,
  },
  icon: {
    fontSize: 58,
  },
  title: {
    marginTop: 8,
    fontSize: 23,
    fontWeight: '900',
    color: colors.ink,
  },
  text: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
    fontWeight: '800',
    color: colors.ink,
  },
  note: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    color: colors.muted,
  },
  allow: {
    alignSelf: 'stretch',
    marginTop: 20,
    padding: 15,
    borderRadius: 16,
    backgroundColor: colors.green,
    alignItems: 'center',
  },
  allowText: {
    color: '#173A00',
    fontSize: 16,
    fontWeight: '900',
  },
  reject: {
    marginTop: 10,
    padding: 11,
  },
  rejectText: {
    color: colors.red,
    fontWeight: '800',
  },
  disabled: {
    opacity: 0.6,
  },
});
