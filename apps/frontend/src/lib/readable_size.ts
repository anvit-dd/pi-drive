export default function readable_size(size_in_bytes: number) {
  for (const unit of ["B", "KB", "MB", "GB", "TB"]) {
    if (size_in_bytes < 1024) return `${size_in_bytes.toFixed(2)} ${unit}`;
    size_in_bytes /= 1024;
  }
}
