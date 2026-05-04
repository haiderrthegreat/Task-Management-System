import { ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import ScreenHeader from '../components/ScreenHeader';
import Screen from '../components/Screen';
import TaskAttachmentsSection from '../components/TaskAttachmentsSection';
import { RootStackParamList } from '../navigation/types';

type FileAttachmentsScreenProps = NativeStackScreenProps<RootStackParamList, 'FileAttachments'>;

const FileAttachmentsScreen = ({ route }: FileAttachmentsScreenProps) => {
  const { taskId, workspaceId } = route.params;

  return (
    <Screen>
      <ScreenHeader title="File Attachments" />

      <ScrollView showsVerticalScrollIndicator={false}>
        <TaskAttachmentsSection
          workspaceId={workspaceId}
          taskId={taskId}
          title="Attachments"
          showHeader={false}
          showRefreshButton
        />
      </ScrollView>
    </Screen>
  );
};

export default FileAttachmentsScreen;
