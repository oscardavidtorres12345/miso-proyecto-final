import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../theme/colors';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const { t } = useTranslation();
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = buildPageList(currentPage, totalPages);

  return (
    <View style={styles.root}>
      <TouchableOpacity
        style={[styles.navBtn, currentPage === 1 && styles.navBtnDisabled]}
        onPress={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        activeOpacity={0.7}
        testID="pagination-prev"
        accessibilityRole="button"
        accessibilityLabel={t('pagination.prevPage')}
        accessibilityState={{ disabled: currentPage === 1 }}
      >
        <ChevronLeft size={18} color={currentPage === 1 ? '#d1d5db' : colors.primary} />
      </TouchableOpacity>

      {pages.map((p, i) =>
        p === '...' ? (
          <Text key={`ellipsis-${i}`} style={styles.ellipsis}>
            …
          </Text>
        ) : (
          <TouchableOpacity
            key={p}
            style={[styles.pageBtn, p === currentPage && styles.pageBtnActive]}
            onPress={() => onPageChange(p)}
            activeOpacity={0.7}
            testID={`pagination-page-${p}`}
            accessibilityRole="button"
            accessibilityLabel={t('pagination.page', { page: p })}
            accessibilityState={{ selected: p === currentPage }}
          >
            <Text style={[styles.pageBtnText, p === currentPage && styles.pageBtnTextActive]}>
              {p}
            </Text>
          </TouchableOpacity>
        ),
      )}

      <TouchableOpacity
        style={[styles.navBtn, currentPage === totalPages && styles.navBtnDisabled]}
        onPress={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        activeOpacity={0.7}
        testID="pagination-next"
        accessibilityRole="button"
        accessibilityLabel={t('pagination.nextPage')}
        accessibilityState={{ disabled: currentPage === totalPages }}
      >
        <ChevronRight size={18} color={currentPage === totalPages ? '#d1d5db' : colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

function buildPageList(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '...')[] = [1];
  if (current > 3) pages.push('...');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    borderColor: '#f3f4f6',
    backgroundColor: '#f9fafb',
  },
  pageBtn: {
    minWidth: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  pageBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pageBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  pageBtnTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  ellipsis: {
    fontSize: 14,
    color: '#9ca3af',
    paddingHorizontal: 4,
  },
});
