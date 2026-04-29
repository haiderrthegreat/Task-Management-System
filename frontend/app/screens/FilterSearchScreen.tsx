import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import Screen from '../components/Screen';

const FilterSearchScreen = () => {
  const [query, setQuery] = useState('');
  const [priority, setPriority] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');
  const [status, setStatus] = useState<'All' | 'Todo' | 'In Progress' | 'Done'>('All');
  const [applied, setApplied] = useState(false);

  return (
    <Screen>
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        placeholder="Search by task title"
        placeholderTextColor="#94A3B8"
      />

      <Text style={styles.sectionLabel}>Priority</Text>
      <View style={styles.row}>
        {(['All', 'High', 'Medium', 'Low'] as const).map((item) => (
          <Pressable
            key={item}
            style={[styles.chip, priority === item ? styles.chipActive : null]}
            onPress={() => setPriority(item)}
          >
            <Text style={[styles.chipText, priority === item ? styles.chipTextActive : null]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Status</Text>
      <View style={styles.row}>
        {(['All', 'Todo', 'In Progress', 'Done'] as const).map((item) => (
          <Pressable
            key={item}
            style={[styles.chip, status === item ? styles.chipActive : null]}
            onPress={() => setStatus(item)}
          >
            <Text style={[styles.chipText, status === item ? styles.chipTextActive : null]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.primaryBtn} onPress={() => setApplied(true)}>
        <Text style={styles.primaryBtnText}>Apply Filters</Text>
      </Pressable>

      {applied ? <Text style={styles.message}>Filters applied to UI state.</Text> : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    color: '#0F172A',
  },
  sectionLabel: {
    color: '#475569',
    fontWeight: '700',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  chipText: {
    color: '#334155',
    fontWeight: '600',
    fontSize: 12,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  primaryBtn: {
    backgroundColor: '#0F766E',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  message: {
    marginTop: 10,
    color: '#0F766E',
    fontWeight: '600',
  },
});

export default FilterSearchScreen;
