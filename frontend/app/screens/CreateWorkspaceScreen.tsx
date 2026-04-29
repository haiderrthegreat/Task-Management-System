import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput } from 'react-native';

import ScreenHeader from '../components/ScreenHeader';
import Screen from '../components/Screen';
import { RootStackParamList } from '../navigation/types';
import {
  getApiErrorMessage,
  useCreateWorkspaceMutation,
  useUpdateWorkspaceMutation,
} from '../store/api';

type CreateWorkspaceScreenProps = NativeStackScreenProps<RootStackParamList, 'CreateWorkspace'>;

const CreateWorkspaceScreen = ({ navigation, route }: CreateWorkspaceScreenProps) => {
  const isEdit = useMemo(() => Boolean(route.params?.workspaceId), [route.params?.workspaceId]);
  const [name, setName] = useState(route.params?.name ?? '');
  const [description, setDescription] = useState(route.params?.description ?? '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createWorkspace, { isLoading }] = useCreateWorkspaceMutation();
  const [updateWorkspace, { isLoading: isUpdating }] = useUpdateWorkspaceMutation();

  useEffect(() => {
    if (route.params?.name !== undefined) {
      setName(route.params.name ?? '');
    }

    if (route.params?.description !== undefined) {
      setDescription(route.params.description ?? '');
    }
  }, [route.params?.name, route.params?.description]);

  const validate = () => {
    if (!isEdit && name.trim().length < 2) {
      setErrorMessage('Workspace name must be at least 2 characters.');
      return false;
    }

    if (isEdit && name.trim().length > 0 && name.trim().length < 2) {
      setErrorMessage('Workspace name must be at least 2 characters.');
      return false;
    }

    if (isEdit && name.trim().length === 0 && description.trim().length === 0) {
      setErrorMessage('Provide a name or description to update.');
      return false;
    }

    if (description.trim().length > 500) {
      setErrorMessage('Description must be under 500 characters.');
      return false;
    }

    setErrorMessage(null);
    return true;
  };

  const handleCreateWorkspace = async () => {
    if (!validate()) return;

    try {
      const trimmedName = name.trim();
      const trimmedDescription = description.trim();
      const payload = {
        ...(trimmedName ? { name: trimmedName } : {}),
        ...(trimmedDescription ? { description: trimmedDescription } : {}),
      };

      if (isEdit && route.params?.workspaceId) {
        await updateWorkspace({
          workspaceId: route.params.workspaceId,
          ...payload,
        }).unwrap();
        navigation.goBack();
        return;
      }

      await createWorkspace(payload as { name: string; description?: string }).unwrap();
      setName('');
      setDescription('');
      navigation.goBack();
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          isEdit
            ? 'Unable to update workspace right now.'
            : 'Unable to create workspace right now.',
        ),
      );
    }
  };

  const isSaving = isLoading || isUpdating;

  return (
    <Screen>
      <ScreenHeader title={isEdit ? 'Edit Workspace' : 'Create Workspace'} />
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Workspace name"
        placeholderTextColor="#94A3B8"
      />
      <TextInput
        style={[styles.input, styles.textarea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Description"
        multiline
        placeholderTextColor="#94A3B8"
      />

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <Pressable
        style={[styles.primaryBtn, isSaving && styles.primaryBtnDisabled]}
        onPress={handleCreateWorkspace}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryBtnText}>
            {isEdit ? 'Update Workspace' : 'Create Workspace'}
          </Text>
        )}
      </Pressable>
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
    marginBottom: 12,
    color: '#0F172A',
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  primaryBtn: {
    backgroundColor: '#0F766E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  errorText: {
    color: '#B91C1C',
    marginBottom: 12,
    fontSize: 13,
  },
});

export default CreateWorkspaceScreen;
