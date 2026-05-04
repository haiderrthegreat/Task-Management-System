import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import AppCard from './AppCard';
import {
  getApiErrorMessage,
  TaskAttachment,
  useDeleteAttachmentMutation,
  useDownloadAttachmentMutation,
  useGetAttachmentsQuery,
  useUploadAttachmentMutation,
} from '../store/api';

type TaskAttachmentsSectionProps = {
  workspaceId: string;
  taskId: string;
  title?: string;
  showHeader?: boolean;
  showRefreshButton?: boolean;
};

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'application/zip',
];

const formatTime = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType.includes('word')) return '📝';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
  if (mimeType === 'text/plain') return '📃';
  if (mimeType === 'application/zip') return '🗜️';
  return '📎';
};

const sanitizeFilename = (name: string): string =>
  name.replace(/[^a-zA-Z0-9.\-_]/g, '_').slice(0, 200);

type AttachmentRowProps = {
  attachment: TaskAttachment;
  onDelete: (attachment: TaskAttachment) => void;
  onDownload: (attachment: TaskAttachment) => void;
  isLast: boolean;
};

const AttachmentRow = ({ attachment, onDelete, onDownload, isLast }: AttachmentRowProps) => (
  <View style={[styles.row, !isLast && styles.rowBorder]}>
    <Text style={styles.icon}>{getFileIcon(attachment.mimeType)}</Text>
    <View style={styles.info}>
      <Text style={styles.name} numberOfLines={1}>
        {attachment.originalName}
      </Text>
      <Text style={styles.meta}>
        {formatFileSize(attachment.fileSize)} · {attachment.uploadedBy.name} · {formatTime(attachment.createdAt)}
      </Text>
    </View>
    <View style={styles.actions}>
      <TouchableOpacity style={styles.iconBtn} onPress={() => onDownload(attachment)} activeOpacity={0.75}>
        <Text style={styles.actionText}>Download</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconBtn} onPress={() => onDelete(attachment)} activeOpacity={0.75}>
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const UploadProgressPill = ({ filename }: { filename: string }) => (
  <View style={styles.uploadingBox}>
    <ActivityIndicator size="small" color="#0F766E" />
    <Text style={styles.uploadingText} numberOfLines={1}>
      Uploading {filename}...
    </Text>
  </View>
);

const TaskAttachmentsSection = ({
  workspaceId,
  taskId,
  title = 'Attachments',
  showHeader = true,
  showRefreshButton = false,
}: TaskAttachmentsSectionProps) => {
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const DocumentPicker = (() => {
    try {
      return require('expo-document-picker');
    } catch {
      return null;
    }
  })();

  const {
    data: attachmentsData = [],
    isLoading,
    isFetching,
    refetch,
  } = useGetAttachmentsQuery(
    { workspaceId, taskId },
    { skip: !workspaceId || !taskId },
  );

  const [uploadAttachment, { isLoading: isUploading }] = useUploadAttachmentMutation();
  const [downloadAttachment, { isLoading: isDownloading }] = useDownloadAttachmentMutation();
  const [deleteAttachment] = useDeleteAttachmentMutation();

  const attachments = attachmentsData;
  const isRefreshing = isFetching && !isLoading;

  const handlePickAndUpload = async () => {
    try {
      if (!DocumentPicker) {
        Alert.alert(
          'Package required',
          'Install expo-document-picker to enable file uploads:\n\nnpx expo install expo-document-picker',
        );
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;

      const file = result.assets?.[0];
      const { name: originalName, uri, mimeType, size } = file ?? {};

      if (!originalName || !uri) {
        Alert.alert('Error', 'Could not read file information.');
        return;
      }

      if (size && size > MAX_FILE_SIZE_BYTES) {
        Alert.alert(
          'File too large',
          `Maximum file size is ${MAX_FILE_SIZE_MB} MB. Your file is ${formatFileSize(size)}.`,
        );
        return;
      }

      if (mimeType && !ALLOWED_MIME_TYPES.includes(mimeType)) {
        Alert.alert(
          'File type not allowed',
          `Files of type "${mimeType}" are not supported.\n\nAllowed: PDF, images, Word, Excel, TXT, ZIP.`,
        );
        return;
      }

      const sanitized = sanitizeFilename(originalName);
      setUploadingFile(sanitized);

      const formData = new FormData();
      formData.append('file', {
        uri,
        name: sanitized,
        type: mimeType ?? 'application/octet-stream',
      } as any);

      await uploadAttachment({ workspaceId, taskId, formData }).unwrap();
    } catch (error: any) {
      Alert.alert('Upload failed', error?.message ?? 'An unexpected error occurred.');
    } finally {
      setUploadingFile(null);
    }
  };

  const handleDownload = async (attachment: TaskAttachment) => {
    try {
      if (Platform.OS !== 'web' || typeof document === 'undefined') {
        Alert.alert('Download', 'File download is available in the web build.');
        return;
      }

      const objectUrl = await downloadAttachment({
        workspaceId,
        taskId,
        attachmentId: attachment.id,
      }).unwrap();

      if (!objectUrl) {
        Alert.alert('Download failed', 'Could not prepare the file for download.');
        return;
      }

      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = attachment.originalName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error: any) {
      Alert.alert('Download failed', error?.message ?? 'Could not download the attachment.');
    }
  };

  const handleDelete = (attachment: TaskAttachment) => {
    Alert.alert('Delete Attachment', `Delete "${attachment.originalName}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAttachment({ workspaceId, taskId, attachmentId: attachment.id }).unwrap();
          } catch (error: any) {
            Alert.alert('Delete failed', getApiErrorMessage(error, 'Could not delete the attachment.'));
          }
        },
      },
    ]);
  };

  return (
    <View>
      {showHeader && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <View style={styles.sectionActions}>
            {showRefreshButton && (
              <Pressable onPress={refetch} style={styles.refreshBtn} hitSlop={6}>
                <Text style={styles.refreshText}>{isRefreshing ? 'Refreshing...' : 'Refresh'}</Text>
              </Pressable>
            )}
            <Text style={styles.sectionCount}>{attachments.length}</Text>
          </View>
        </View>
      )}

      <AppCard>
        {isLoading && attachments.length === 0 ? (
          <View style={styles.centerState}>
            <ActivityIndicator color="#0F766E" />
            <Text style={styles.centerText}>Loading attachments...</Text>
          </View>
        ) : attachments.length === 0 && !uploadingFile ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📎</Text>
            <Text style={styles.emptyTitle}>No attachments yet</Text>
            <Text style={styles.emptySubtitle}>Upload the first file for this task.</Text>
          </View>
        ) : (
          <>
            {attachments.map((attachment, index) => (
              <AttachmentRow
                key={attachment.id}
                attachment={attachment}
                onDelete={handleDelete}
                onDownload={handleDownload}
                isLast={index === attachments.length - 1 && !uploadingFile}
              />
            ))}

            {uploadingFile && <UploadProgressPill filename={uploadingFile} />}
          </>
        )}
      </AppCard>

      <TouchableOpacity
        style={[styles.primaryBtn, (uploadingFile || isUploading || isDownloading) && styles.primaryBtnDisabled]}
        onPress={handlePickAndUpload}
        disabled={!!uploadingFile || isUploading || isDownloading}
        activeOpacity={0.85}
      >
        <Text style={styles.primaryBtnText}>
          {uploadingFile || isUploading ? 'Uploading…' : 'Upload New File'}
        </Text>
      </TouchableOpacity>

      <View style={styles.noteBox}>
        <Text style={styles.noteText}>
          PDF, images, Word, Excel, TXT, ZIP · max {MAX_FILE_SIZE_MB} MB
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 10,
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionCount: {
    backgroundColor: '#E2E8F0',
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
  },
  refreshBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  refreshText: {
    color: '#0F766E',
    fontSize: 12,
    fontWeight: '700',
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 26,
  },
  centerText: {
    marginTop: 8,
    color: '#64748B',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 26,
  },
  emptyIcon: {
    fontSize: 28,
  },
  emptyTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySubtitle: {
    marginTop: 4,
    color: '#64748B',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  icon: {
    fontSize: 22,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  meta: {
    marginTop: 2,
    fontSize: 11,
    color: '#94A3B8',
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  iconBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  actionText: {
    color: '#0F766E',
    fontSize: 12,
    fontWeight: '700',
  },
  deleteText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  uploadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  uploadingText: {
    flex: 1,
    color: '#0F766E',
    fontSize: 12,
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: '#0F766E',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryBtnDisabled: {
    opacity: 0.55,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  noteBox: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
  },
  noteText: {
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default TaskAttachmentsSection;