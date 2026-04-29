import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import AppCard from '../components/AppCard';
import ScreenHeader from '../components/ScreenHeader';
import Screen from '../components/Screen';
import { taskflowRepository } from '../data/taskflowRepository';
import { RootStackParamList } from '../navigation/types';

type FileAttachmentsScreenProps = NativeStackScreenProps<RootStackParamList, 'FileAttachments'>;

const FileAttachmentsScreen = ({ route }: FileAttachmentsScreenProps) => {
  const taskFiles = taskflowRepository.getFilesByTaskId(route.params.taskId);
  const [uploading, setUploading] = useState(false);

  return (
    <Screen>
      <ScreenHeader title="File Attachments" />
      {taskFiles.map((file) => (
        <AppCard key={file.id}>
          <Text style={styles.fileName}>{file.name}</Text>
          <Text style={styles.meta}>{file.size} • {file.uploadedBy}</Text>
          <Text style={styles.meta}>{file.uploadedAt}</Text>
        </AppCard>
      ))}

      <Pressable style={styles.primaryBtn} onPress={() => setUploading(true)}>
        <Text style={styles.primaryBtnText}>Upload New File</Text>
      </Pressable>

      <View style={styles.noteBox}>
        <Text style={styles.noteText}>
          {uploading ? 'Uploading file... (demo UI)' : 'UI only upload area (no backend)'}
        </Text>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  fileName: {
    color: '#0F172A',
    fontWeight: '700',
  },
  meta: {
    color: '#64748B',
    marginTop: 4,
    fontSize: 12,
  },
  primaryBtn: {
    backgroundColor: '#0F766E',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  noteBox: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
  },
  noteText: {
    color: '#1D4ED8',
    fontWeight: '600',
  },
});

export default FileAttachmentsScreen;
