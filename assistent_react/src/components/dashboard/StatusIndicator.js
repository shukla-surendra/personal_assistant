import { Badge } from "@chakra-ui/react";

export function StatusIndicator({ status }) {
  let color = "";
  let status_text = "Undefined";
  switch (status) {
    case "todo":
      color = "red";
      status_text = "todo";
      break;
    case "in_progress":
      color = "yellow";
      status_text = "in progress";
      break;
    case "done":
      color = "green";
      status_text = "done";
      break;
    default:
      color = "gray";
      status_text = status;
      break;
  }

  return <Badge colorScheme={color}>{status_text}</Badge>;
}
