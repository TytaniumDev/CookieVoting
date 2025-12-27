import { ref, listAll, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

export { deleteObject };

export async function deleteFolder(folderPath: string): Promise<void> {
  const folderRef = ref(storage, folderPath);
  const fileList = await listAll(folderRef);
  const deletePromises = fileList.items.map((fileRef) => deleteObject(fileRef));
  await Promise.all(deletePromises);
}
