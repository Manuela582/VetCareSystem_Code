const MAX_BYTES = 2 * 1024 * 1024;

export function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Solo se permiten archivos de imagen'));
      return;
    }
    if (file.size > MAX_BYTES) {
      reject(new Error('La imagen no debe superar 2 MB'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.readAsDataURL(file);
  });
}
