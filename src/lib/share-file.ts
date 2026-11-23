import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/** Writes a text file to the cache and opens the Android share sheet (save to Drive, WhatsApp, etc). */
export async function shareTextFile(name: string, content: string, mimeType: string) {
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  file.write(content);
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device');
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: 'Export transactions' });
}
