import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';
import type { Conversation } from '@/types';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return d.toLocaleDateString();
}

function ConversationRow({
  conv,
  onPress,
  onDelete,
}: {
  conv: Conversation;
  onPress: () => void;
  onDelete: () => void;
}) {
  const colors = useColors();
  const lastMsg = conv.messages[conv.messages.length - 1];

  return (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.rowLeft}>
        <View style={[styles.iconBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="message-square" size={16} color={colors.primary} />
        </View>
        <View style={styles.rowText}>
          <Text
            style={[styles.rowTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}
            numberOfLines={1}
          >
            {conv.title}
          </Text>
          {lastMsg && (
            <Text
              style={[styles.rowPreview, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}
              numberOfLines={1}
            >
              {lastMsg.role === 'user' ? 'You: ' : ''}{lastMsg.content}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.rowRight}>
        <Text style={[styles.rowTime, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
          {formatDate(conv.updatedAt)}
        </Text>
        <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="trash-2" size={15} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function ConversationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { conversations, deleteConversation, setActiveConversationId } = useApp();

  const handleOpen = (id: string) => {
    setActiveConversationId(id);
    router.push('/');
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert('Delete conversation', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteConversation(id),
      },
    ]);
  };

  const sorted = [...conversations].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const paddingBottom = Platform.OS === 'ios' ? insets.bottom + 56 : 56 + 16;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 8 }]}>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
          History
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {sorted.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="clock" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            No conversations yet
          </Text>
          <Text style={[styles.emptyHint, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            Start chatting to see history here
          </Text>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom }}
          renderItem={({ item }) => (
            <ConversationRow
              conv={item}
              onPress={() => handleOpen(item.id)}
              onDelete={() => handleDelete(item.id, item.title)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: { fontSize: 28, marginBottom: 2 },
  subtitle: { fontSize: 13 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    justifyContent: 'space-between',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 15, marginBottom: 2 },
  rowPreview: { fontSize: 13 },
  rowRight: { alignItems: 'flex-end', gap: 6, marginLeft: 8 },
  rowTime: { fontSize: 11 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontSize: 16, marginTop: 12 },
  emptyHint: { fontSize: 13 },
});
