import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function convertToRelativeTime(unix_time: number) {
  return dayjs(unix_time * 1000).fromNow();
}
