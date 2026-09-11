export function isTaskFrozen(
  assignee?: { isActive?: boolean } | null,
  executor?: { isActive?: boolean } | null,
): boolean {
  return assignee?.isActive === false || executor?.isActive === false
}
