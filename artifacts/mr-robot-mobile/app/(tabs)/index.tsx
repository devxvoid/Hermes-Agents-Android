import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';
import { sendMessage } from '@/lib/ai';
import type { Conversation, Message } from '@/types';

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function generateTitle(firstMessage: string): string {
  return firstMessage.slice(0, 40) + (firstMessage.length > 40 ? '...' : '');
}

function TypingIndicator() {
  const colors = useColors();
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    const animate = (val: SharedValue<number>, delay: number) => {
      setTimeout(() => {
        val.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 300 }),
            withTiming(0, { duration: 300 })
          ),
          -1
        );
      }, delay);
    };
    animate(dot1, 0);
    animate(dot2, 150);
    animate(dot3, 300);
  }, []);

  const d1Style = useAnimatedStyle(() => ({ opacity: 0.3 + dot1.value * 0.7 }));
  const d2Style = useAnimatedStyle(() => ({ opacity: 0.3 + dot2.value * 0.7 }));
  const d3Style = useAnimatedStyle(() => ({ opacity: 0.3 + dot3.value * 0.7 }));

  return (
    <View style={[styles.bubble, styles.assistantBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.dots}>
        {[d1Style, d2Style, d3Style].map((s, i) => (
          <Animated.View
            key={i}
            style={[styles.dot, s, { backgroundColor: colors.primary }]}
          />
        ))}
      </View>
    </View>
  );
}

function MessageBubble({ msg, isLast }: { msg: Message; isLast: boolean }) {
  const colors = useColors();
  const isUser = msg.role === 'user';

  return (
    <Animated.View
      entering={FadeInDown.duration(250).springify()}
      style={[styles.messageRow, isUser ? styles.userRow : styles.assistantRow]}
    >
      {!isUser && (
        <View style={[styles.avatar, { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}>
          <Text style={[styles.avatarText, { color: colors.primary, fontFamily: 'Inter_700Bold' }]}>MR</Text>
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser
            ? [styles.userBubble, { backgroundColor: colors.primary }]
            : [styles.assistantBubble, { backgroundColor: colors.card, borderColor: colors.border }],
          msg.isStreaming && styles.streamingBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            {
              color: isUser ? colors.primaryForeground : colors.foreground,
              fontFamily: 'Inter_400Regular',
            },
          ]}
          selectable
        >
          {msg.content}
          {msg.isStreaming && (
            <Text style={{ color: colors.primary }}>▋</Text>
          )}
        </Text>
      </View>
    </Animated.View>
  );
}

function EmptyChat() {
  const colors = useColors();
  return (
    <Animated.View entering={FadeInUp.duration(400)} style={styles.emptyContainer}>
      <View style={[styles.logoContainer, { borderColor: colors.primary + '44' }]}>
        <Text style={[styles.logoText, { color: colors.primary, fontFamily: 'Inter_700Bold' }]}>MR</Text>
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
        Mr. Robot
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
        Advanced AI Operating System
      </Text>
      <View style={styles.suggestionsRow}>
        {['Explain quantum computing', 'Write a Python script', 'Analyze this vulnerability'].map(s => (
          <View key={s} style={[styles.suggestionChip, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.suggestionText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              {s}
            </Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    conversations, activeConversationId, setActiveConversationId,
    addConversation, addMessage, updateMessage, updateConversation,
    activeProvider, settings, memories,
  } = useApp();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const activeConversation = conversations.find(c => c.id === activeConversationId) ?? null;
  const messages = activeConversation?.messages ?? [];

  const scrollToBottom = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
  }, []);

  useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    if (!activeProvider) {
      Alert.alert(
        'No AI Provider',
        'Please configure an AI provider in Settings before chatting.',
        [{ text: 'OK' }]
      );
      return;
    }

    setInput('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };

    const prevMessages = (activeConversation?.messages ?? []).concat(userMsg);

    let convId = activeConversationId;

    if (!convId) {
      const newConv: Conversation = {
        id: generateId(),
        title: generateTitle(text),
        messages: [userMsg],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pinned: false,
      };
      addConversation(newConv);
      setActiveConversationId(newConv.id);
      convId = newConv.id;
    } else {
      addMessage(convId, userMsg);
    }

    const assistantMsgId = generateId();
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      isStreaming: true,
    };

    setIsLoading(true);
    addMessage(convId, assistantMsg);

    scrollToBottom();

    try {
      const activeMemories = memories.filter(m => m.active);
      const memoryContext = activeMemories.length > 0
        ? '\n\n[Context: ' + activeMemories.map(m => `${m.title}: ${m.content}`).join('. ') + ']'
        : '';

      const messagesForAI: Message[] = [
        ...prevMessages.slice(-20),
      ];

      if (memoryContext && messagesForAI.length === 1) {
        messagesForAI[0] = {
          ...messagesForAI[0],
          content: messagesForAI[0].content + memoryContext,
        };
      }

      let accumulated = '';

      if (settings.streamingEnabled) {
        await sendMessage(
          messagesForAI,
          activeProvider,
          settings,
          (chunk) => {
            accumulated += chunk;
            updateMessage(convId!, assistantMsgId, {
              content: accumulated,
              isStreaming: true,
            });
          }
        );
      } else {
        accumulated = await sendMessage(messagesForAI, activeProvider, settings);
      }

      updateMessage(convId!, assistantMsgId, {
        content: accumulated || '(empty response)',
        isStreaming: false,
      });

      if (convId) {
        const currentConv = conversations.find(c => c.id === convId);
        if (currentConv && currentConv.messages.length <= 2) {
          updateConversation(convId, { title: generateTitle(text) });
        }
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      updateMessage(convId!, assistantMsgId, {
        content: `Error: ${err?.message ?? 'Something went wrong'}`,
        isStreaming: false,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  }, [input, isLoading, activeProvider, activeConversationId, activeConversation, conversations, settings, memories]);

  const handleNewChat = () => {
    setActiveConversationId(null);
    setInput('');
  };

  const paddingBottom = Platform.OS === 'ios' ? insets.bottom : 16;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.headerDot, { backgroundColor: activeProvider ? colors.primary : colors.mutedForeground }]} />
          <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
            {settings.agentName}
          </Text>
          {activeConversation && (
            <Text style={[styles.headerConvTitle, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]} numberOfLines={1}>
              · {activeConversation.title}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.newChatBtn, { borderColor: colors.border }]}
          onPress={handleNewChat}
        >
          <Feather name="plus" size={16} color={colors.primary} />
          <Text style={[styles.newChatText, { color: colors.primary, fontFamily: 'Inter_500Medium' }]}>New</Text>
        </TouchableOpacity>
      </View>

      {messages.length === 0 && !isLoading ? (
        <EmptyChat />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.messageList, { paddingBottom: 8 }]}
          renderItem={({ item, index }) => (
            <MessageBubble msg={item} isLast={index === messages.length - 1} />
          )}
          ListFooterComponent={isLoading && messages[messages.length - 1]?.role !== 'assistant' ? <TypingIndicator /> : null}
          onContentSizeChange={scrollToBottom}
          showsVerticalScrollIndicator={false}
        />
      )}

      {!activeProvider && (
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={[styles.noProviderBanner, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Feather name="alert-circle" size={14} color={colors.mutedForeground} />
          <Text style={[styles.noProviderText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            No AI provider configured — go to Settings to add one
          </Text>
        </Animated.View>
      )}

      <View
        style={[
          styles.inputContainer,
          { borderTopColor: colors.border, paddingBottom: paddingBottom + 60 },
        ]}
      >
        <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
            value={input}
            onChangeText={setInput}
            placeholder="Send a message..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            maxLength={4000}
            returnKeyType="default"
            onSubmitEditing={Platform.OS === 'web' ? handleSend : undefined}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              {
                backgroundColor: input.trim() && !isLoading && activeProvider
                  ? colors.primary
                  : colors.muted,
              },
            ]}
            onPress={handleSend}
            disabled={!input.trim() || isLoading || !activeProvider}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.mutedForeground} />
            ) : (
              <Feather
                name="send"
                size={16}
                color={input.trim() && activeProvider ? colors.primaryForeground : colors.mutedForeground}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 },
  headerDot: { width: 8, height: 8, borderRadius: 4 },
  headerTitle: { fontSize: 17 },
  headerConvTitle: { fontSize: 13, flex: 1 },
  newChatBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1,
  },
  newChatText: { fontSize: 13 },
  messageList: { padding: 16, gap: 12 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  userRow: { justifyContent: 'flex-end' },
  assistantRow: { justifyContent: 'flex-start' },
  avatar: {
    width: 32, height: 32, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 9 },
  bubble: {
    maxWidth: '78%', padding: 12, borderRadius: 16,
  },
  userBubble: { borderBottomRightRadius: 4 },
  assistantBubble: { borderWidth: 1, borderBottomLeftRadius: 4 },
  streamingBubble: {},
  messageText: { fontSize: 15, lineHeight: 22 },
  dots: { flexDirection: 'row', gap: 4, paddingVertical: 4, paddingHorizontal: 4 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  emptyContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12,
  },
  logoContainer: {
    width: 72, height: 72, borderRadius: 20, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  logoText: { fontSize: 20 },
  emptyTitle: { fontSize: 26 },
  emptySubtitle: { fontSize: 14, textAlign: 'center' },
  suggestionsRow: { gap: 8, marginTop: 16, width: '100%' },
  suggestionChip: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1,
  },
  suggestionText: { fontSize: 13 },
  noProviderBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginBottom: 4, padding: 10,
    borderRadius: 10, borderWidth: 1,
  },
  noProviderText: { fontSize: 12, flex: 1 },
  inputContainer: { borderTopWidth: 1, paddingTop: 8, paddingHorizontal: 12 },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    borderWidth: 1, borderRadius: 16, paddingLeft: 14, paddingRight: 6, paddingVertical: 6,
    gap: 6,
  },
  input: { flex: 1, fontSize: 15, lineHeight: 21, maxHeight: 120, paddingVertical: 4 },
  sendBtn: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
});
