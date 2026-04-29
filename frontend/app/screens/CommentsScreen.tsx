import { useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import AppCard from '../components/AppCard';
import Avatar from '../components/Avatar';
import ScreenHeader from '../components/ScreenHeader';
import Screen from '../components/Screen';
import { taskflowRepository } from '../data/taskflowRepository';
import { RootStackParamList } from '../navigation/types';

type CommentsScreenProps = NativeStackScreenProps<RootStackParamList, 'Comments'>;

const CommentsScreen = ({ route }: CommentsScreenProps) => {
  const [draft, setDraft] = useState('');
  const [posted, setPosted] = useState(false);
  const taskComments = useMemo(() => taskflowRepository.getCommentsByTaskId(route.params.taskId), [route.params.taskId]);

  return (
    <Screen>
      <ScreenHeader title="Comments" />
      {taskComments.map((comment) => {
        const member = taskflowRepository.getMemberById(comment.memberId);
        return (
          <AppCard key={comment.id}>
            <View style={styles.row}>
              <Avatar name={member?.name ?? 'NA'} size={30} />
              <View style={styles.commentBody}>
                <Text style={styles.commentAuthor}>{member?.name ?? 'Unknown'}</Text>
                <Text style={styles.commentText}>{comment.text}</Text>
                <Text style={styles.commentTime}>{comment.time}</Text>
              </View>
            </View>
          </AppCard>
        );
      })}

      <TextInput
        style={styles.input}
        value={draft}
        onChangeText={setDraft}
        placeholder="Write a comment"
        placeholderTextColor="#94A3B8"
      />
      <Pressable style={styles.primaryBtn} onPress={() => setPosted(true)}>
        <Text style={styles.primaryBtnText}>Post Comment</Text>
      </Pressable>

      {posted ? <Text style={styles.message}>Comment posted (demo UI).</Text> : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  commentBody: {
    flex: 1,
  },
  commentAuthor: {
    color: '#0F172A',
    fontWeight: '700',
  },
  commentText: {
    color: '#334155',
    marginTop: 4,
    lineHeight: 20,
  },
  commentTime: {
    marginTop: 4,
    color: '#64748B',
    fontSize: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    color: '#0F172A',
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

export default CommentsScreen;
