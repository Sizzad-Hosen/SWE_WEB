import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from '../../../web/dom';

import { colors, shadows } from '../../../theme/theme';
import { getClass1BanglaPageImage } from '../data/textbookPageImages';

type Props = {
  title: string;
  pageStart: number;
  pageEnd: number;
  sourceLabel: string;
};

const pageAspectRatio = 943 / 1235;
const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

function toBanglaNumber(value: number) {
  return String(value).replace(/\d/g, (digit) => banglaDigits[Number(digit)]);
}

export function TextbookActivity({
  title,
  pageStart,
  pageEnd,
  sourceLabel,
}: Props) {
  const [selectedPage, setSelectedPage] = useState<number | null>(null);
  const pages = useMemo(
    () =>
      Array.from(
        { length: pageEnd - pageStart + 1 },
        (_, index) => pageStart + index
      ),
    [pageEnd, pageStart]
  );

  return (
    <View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.instructions}>
        পাতায় চাপ দিলে বড় করে দেখা যাবে
      </Text>

      {pages.map((page) => (
        <Pressable
          key={page}
          style={styles.pageCard}
          onPress={() => setSelectedPage(page)}
          accessibilityRole="button"
          accessibilityLabel={`বইয়ের পৃষ্ঠা ${toBanglaNumber(page)} বড় করে দেখুন`}
        >
          <View style={styles.pageBadge}>
            <Text style={styles.pageBadgeText}>পৃষ্ঠা {toBanglaNumber(page)}</Text>
          </View>
          <Image
            source={getClass1BanglaPageImage(page)}
            style={styles.pageImage}
            resizeMode="contain"
          />
          <Text style={styles.zoomHint}>🔍 বড় করে দেখুন</Text>
        </Pressable>
      ))}

      <Text style={styles.source}>{sourceLabel}</Text>

      <Modal
        visible={selectedPage !== null}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={() => setSelectedPage(null)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedPage ? `পৃষ্ঠা ${toBanglaNumber(selectedPage)}` : ''}
            </Text>
            <Pressable
              style={styles.closeButton}
              onPress={() => setSelectedPage(null)}
              accessibilityRole="button"
              accessibilityLabel="বইয়ের পাতা বন্ধ করুন"
            >
              <Text style={styles.closeText}>✕ বন্ধ করুন</Text>
            </Pressable>
          </View>
          {selectedPage ? (
            <ScrollView
              style={styles.zoomScroll}
              contentContainerStyle={styles.zoomContent}
              minimumZoomScale={1}
              maximumZoomScale={4}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              centerContent
            >
              <Image
                source={getClass1BanglaPageImage(selectedPage)}
                style={styles.modalImage}
                resizeMode="contain"
              />
            </ScrollView>
          ) : null}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 23,
    fontWeight: '900',
    color: '#125C7B',
    textAlign: 'center',
  },
  instructions: {
    marginTop: 5,
    marginBottom: 12,
    color: colors.muted,
    textAlign: 'center',
    fontWeight: '700',
  },
  pageCard: {
    marginBottom: 16,
    padding: 8,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#BFD4E2',
    backgroundColor: '#F7FBFD',
    ...shadows.card,
  },
  pageBadge: {
    alignSelf: 'flex-start',
    marginBottom: 7,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: colors.orange,
  },
  pageBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 11,
  },
  pageImage: {
    width: '100%',
    aspectRatio: pageAspectRatio,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  zoomHint: {
    marginTop: 7,
    textAlign: 'center',
    color: '#126D90',
    fontWeight: '900',
  },
  source: {
    marginTop: 2,
    textAlign: 'center',
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
  },
  modalSafe: {
    flex: 1,
    backgroundColor: '#14202B',
  },
  modalHeader: {
    minHeight: 58,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#14202B',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
  closeButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: colors.orange,
  },
  closeText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  zoomScroll: {
    flex: 1,
  },
  zoomContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImage: {
    width: Dimensions.get('window').width,
    aspectRatio: pageAspectRatio,
    backgroundColor: '#FFFFFF',
  },
});
