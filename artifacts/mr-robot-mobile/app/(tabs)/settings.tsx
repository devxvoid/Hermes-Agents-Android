import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert, Modal, Platform, ScrollView, StyleSheet, Switch, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';
import { DEFAULT_BASE_URLS, DEFAULT_MODELS } from '@/lib/ai';
import type { AIProvider } from '@/types';

type ProviderType = AIProvider['type'];

const PROVIDER_TYPES: { type: ProviderType; label: string; icon: string }[] = [
  { type: 'openai-compatible', label: 'OpenAI / Compatible', icon: 'cpu' },
  { type: 'anthropic', label: 'Anthropic', icon: 'zap' },
  { type: 'gemini', label: 'Google Gemini', icon: 'star' },
];

function SectionHeader({ title }: { title: string }) {
  const colors = useColors();
  return (
    <Text style={[styles.sectionTitle, { color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }]}>
      {title}
    </Text>
  );
}

function Row({ label, value, onPress, right }: { label: string; value?: string; onPress?: () => void; right?: React.ReactNode }) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text style={[styles.rowLabel, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}>
        {label}
      </Text>
      {right ?? (
        value !== undefined && (
          <View style={styles.rowRight}>
            <Text style={[styles.rowValue, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              {value}
            </Text>
            {onPress && <Feather name="chevron-right" size={16} color={colors.mutedForeground} />}
          </View>
        )
      )}
    </TouchableOpacity>
  );
}

function ProviderModal({
  visible,
  onClose,
  onSave,
  existing,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (p: AIProvider) => void;
  existing?: AIProvider | null;
}) {
  const colors = useColors();
  const [type, setType] = useState<ProviderType>(existing?.type ?? 'openai-compatible');
  const [name, setName] = useState(existing?.name ?? '');
  const [apiKey, setApiKey] = useState(existing?.apiKey ?? '');
  const [baseUrl, setBaseUrl] = useState(existing?.baseUrl ?? '');
  const [model, setModel] = useState(existing?.selectedModel ?? '');

  const models = DEFAULT_MODELS[type] ?? [];

  const handleSave = () => {
    if (!name.trim() || !apiKey.trim()) {
      Alert.alert('Missing fields', 'Provider name and API key are required.');
      return;
    }
    const now = new Date().toISOString();
    onSave({
      id: existing?.id ?? `prov_${Date.now()}`,
      name: name.trim(),
      type,
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim() || (DEFAULT_BASE_URLS[type] ?? ''),
      selectedModel: model.trim() || (models[0] ?? ''),
      enabled: true,
      status: 'not_configured',
      createdAt: existing?.createdAt ?? now,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
          <View style={[styles.modal, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
                {existing ? 'Edit Provider' : 'Add AI Provider'}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
              PROVIDER TYPE
            </Text>
            <View style={styles.typeRow}>
              {PROVIDER_TYPES.map(pt => (
                <TouchableOpacity
                  key={pt.type}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: type === pt.type ? colors.primary : colors.background,
                      borderColor: type === pt.type ? colors.primary : colors.border,
                      flex: 1,
                    },
                  ]}
                  onPress={() => {
                    setType(pt.type);
                    setBaseUrl('');
                    setModel('');
                  }}
                >
                  <Text style={[styles.typeChipText, { color: type === pt.type ? colors.primaryForeground : colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
                    {pt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {(['Name', 'API Key', 'Base URL', 'Model'] as const).map((f, i) => {
              const vals = [name, apiKey, baseUrl, model];
              const setVals = [setName, setApiKey, setBaseUrl, setModel];
              const phs = [
                'e.g. My GPT-4',
                'sk-...',
                DEFAULT_BASE_URLS[type] || 'optional',
                models[0] || 'model name',
              ];
              const isSecret = f === 'API Key';
              return (
                <View key={f}>
                  <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
                    {f.toUpperCase()}
                  </Text>
                  <TextInput
                    style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border, fontFamily: 'Inter_400Regular' }]}
                    value={vals[i]}
                    onChangeText={setVals[i]}
                    placeholder={phs[i]}
                    placeholderTextColor={colors.mutedForeground}
                    secureTextEntry={isSecret}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              );
            })}

            {models.length > 0 && (
              <>
                <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
                  QUICK SELECT
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', gap: 8, paddingRight: 16 }}>
                    {models.map(m => (
                      <TouchableOpacity
                        key={m}
                        style={[
                          styles.modelChip,
                          {
                            backgroundColor: model === m ? colors.primary : colors.background,
                            borderColor: model === m ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => setModel(m)}
                      >
                        <Text style={[styles.modelChipText, { color: model === m ? colors.primaryForeground : colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                          {m}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </>
            )}

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary, marginTop: 16 }]}
              onPress={handleSave}
            >
              <Text style={[styles.saveBtnText, { color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold' }]}>
                {existing ? 'Save Changes' : 'Add Provider'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, providers, addProvider, updateProvider, deleteProvider } = useApp();

  const [showProviderModal, setShowProviderModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null);

  const [agentNameEdit, setAgentNameEdit] = useState(false);
  const [agentNameVal, setAgentNameVal] = useState(settings.agentName);

  const paddingBottom = Platform.OS === 'ios' ? insets.bottom + 56 : 56 + 16;

  const handleSaveProvider = (p: AIProvider) => {
    if (editingProvider) {
      updateProvider(p.id, p);
    } else {
      addProvider(p);
      if (!settings.activeProviderId) {
        updateSettings({ activeProviderId: p.id, activeModelId: p.selectedModel });
      }
    }
    setShowProviderModal(false);
    setEditingProvider(null);
  };

  const handleDeleteProvider = (id: string, name: string) => {
    Alert.alert('Remove provider', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteProvider(id) },
    ]);
  };

  const activeProvider = providers.find(p => p.id === settings.activeProviderId);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom }}
    >
      <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 8 }]}>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
          Settings
        </Text>
      </View>

      <SectionHeader title="AGENT" />
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {agentNameEdit ? (
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <TextInput
              style={[styles.inlineInput, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
              value={agentNameVal}
              onChangeText={setAgentNameVal}
              autoFocus
              onSubmitEditing={() => {
                updateSettings({ agentName: agentNameVal.trim() || 'Mr. Robot' });
                setAgentNameEdit(false);
              }}
            />
            <TouchableOpacity onPress={() => {
              updateSettings({ agentName: agentNameVal.trim() || 'Mr. Robot' });
              setAgentNameEdit(false);
            }}>
              <Feather name="check" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        ) : (
          <Row
            label="Agent Name"
            value={settings.agentName}
            onPress={() => {
              setAgentNameVal(settings.agentName);
              setAgentNameEdit(true);
            }}
          />
        )}
        <Row
          label="Response Style"
          value={settings.responseStyle}
          onPress={() => {
            const styles2 = ['concise', 'balanced', 'detailed'] as const;
            const idx = styles2.indexOf(settings.responseStyle);
            updateSettings({ responseStyle: styles2[(idx + 1) % 3] });
          }}
        />
      </View>

      <SectionHeader title="APPEARANCE" />
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Row
          label="AMOLED Black"
          right={
            <Switch
              value={settings.amoledBlack}
              onValueChange={v => updateSettings({ amoledBlack: v })}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor="#fff"
            />
          }
        />
        <Row
          label="Hacker Mode"
          right={
            <Switch
              value={settings.hackerMode}
              onValueChange={v => updateSettings({ hackerMode: v })}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor="#fff"
            />
          }
        />
        <Row
          label="Streaming Responses"
          right={
            <Switch
              value={settings.streamingEnabled}
              onValueChange={v => updateSettings({ streamingEnabled: v })}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor="#fff"
            />
          }
        />
      </View>

      <SectionHeader title="AI PROVIDERS" />
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {providers.length === 0 ? (
          <View style={styles.noProviders}>
            <Text style={[styles.noProvidersText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              No providers configured. Add one to start chatting.
            </Text>
          </View>
        ) : (
          providers.map(p => (
            <View key={p.id} style={[styles.providerRow, { borderBottomColor: colors.border }]}>
              <View style={styles.providerLeft}>
                <View style={[styles.providerDot, { backgroundColor: p.id === settings.activeProviderId ? colors.primary : colors.mutedForeground }]} />
                <View>
                  <Text style={[styles.providerName, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
                    {p.name}
                  </Text>
                  <Text style={[styles.providerMeta, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                    {p.selectedModel} · {p.type}
                  </Text>
                </View>
              </View>
              <View style={styles.providerActions}>
                {p.id !== settings.activeProviderId && (
                  <TouchableOpacity
                    style={[styles.activateBtn, { borderColor: colors.primary }]}
                    onPress={() => updateSettings({ activeProviderId: p.id, activeModelId: p.selectedModel })}
                  >
                    <Text style={[styles.activateBtnText, { color: colors.primary, fontFamily: 'Inter_500Medium' }]}>
                      Use
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => { setEditingProvider(p); setShowProviderModal(true); }}
                  style={{ padding: 6 }}
                >
                  <Feather name="edit-2" size={15} color={colors.mutedForeground} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteProvider(p.id, p.name)} style={{ padding: 6 }}>
                  <Feather name="trash-2" size={15} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        <TouchableOpacity
          style={[styles.addProviderBtn, { borderColor: colors.primary }]}
          onPress={() => { setEditingProvider(null); setShowProviderModal(true); }}
        >
          <Feather name="plus" size={16} color={colors.primary} />
          <Text style={[styles.addProviderText, { color: colors.primary, fontFamily: 'Inter_500Medium' }]}>
            Add Provider
          </Text>
        </TouchableOpacity>
      </View>

      {activeProvider && (
        <>
          <SectionHeader title="ACTIVE MODEL" />
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Row label="Provider" value={activeProvider.name} />
            <Row
              label="Model"
              value={activeProvider.selectedModel}
              onPress={() => {
                const models = DEFAULT_MODELS[activeProvider.type] ?? [];
                const idx = models.indexOf(activeProvider.selectedModel);
                const nextModel = models[(idx + 1) % models.length];
                if (nextModel) {
                  updateProvider(activeProvider.id, { selectedModel: nextModel });
                  updateSettings({ activeModelId: nextModel });
                }
              }}
            />
          </View>
        </>
      )}

      <ProviderModal
        visible={showProviderModal}
        onClose={() => { setShowProviderModal(false); setEditingProvider(null); }}
        onSave={handleSaveProvider}
        existing={editingProvider}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, marginBottom: 4 },
  title: { fontSize: 28 },
  sectionTitle: {
    fontSize: 11, letterSpacing: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 6,
  },
  section: { marginHorizontal: 16, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: { fontSize: 15 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowValue: { fontSize: 15 },
  inlineInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  noProviders: { padding: 16 },
  noProvidersText: { fontSize: 13, lineHeight: 20 },
  providerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  providerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  providerDot: { width: 8, height: 8, borderRadius: 4 },
  providerName: { fontSize: 15 },
  providerMeta: { fontSize: 12, marginTop: 1 },
  providerActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  activateBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  activateBtnText: { fontSize: 12 },
  addProviderBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 14, borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'transparent',
  },
  addProviderText: { fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalScroll: { justifyContent: 'flex-end', flexGrow: 1 },
  modal: { borderRadius: 20, borderWidth: 1, padding: 20, margin: 16, marginBottom: 32 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18 },
  label: { fontSize: 11, letterSpacing: 0.8, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeChip: { paddingVertical: 8, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  typeChipText: { fontSize: 11 },
  modelChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  modelChipText: { fontSize: 12 },
  saveBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { fontSize: 16 },
});
