import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { storage } from './firebase';
import { v4 as uuidv4 } from 'uuid';

export { deleteObject };

export async function uploadImage(file: File, path: string): Promise<string> {
  const fileExtension = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${fileExtension}`;
  const storageRef = ref(storage, `${path}/${fileName}`);

  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);

  return downloadURL;
}

export async function deleteFolder(folderPath: string): Promise<void> {
  const folderRef = ref(storage, folderPath);
  const fileList = await listAll(folderRef);
  const deletePromises = fileList.items.map((fileRef) => deleteObject(fileRef));
  await Promise.all(deletePromises);
}
