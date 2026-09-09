# Kanban — 6 cột tuyến tính

Cột: `PENDING_APPROVAL → TODO → IN_PROGRESS → PENDING_ACCEPTANCE → DONE → REJECTED` (định nghĩa ở `KANBAN_STATUSES` trong `lib/constants.ts`).

Thực thi trong `features/tasks/components/task-kanban.tsx`: `DndContext` + `SortableContext` (dnd-kit, PointerSensor distance 8px), `Column` (droppable) và `SortableCard` (draggable). Kéo thả không tự chuyển — `handleDragEnd` chỉ tính `targetStatus` rồi gọi `onRequestMove(taskId, from, to)` để trang `tasks-page.tsx` mở `ConfirmTransitionDialog` (yêu cầu lý do khi `PENDING_ACCEPTANCE→TODO` hoặc `→REJECTED`). Chỉ khi người dùng xác nhận mới gọi `POST /api/tasks/[id]/transition`; hủy thì board giữ nguyên.

Card có nút nhanh "Duyệt" (PENDING_APPROVAL→TODO) và "Nghiệm thu" (PENDING_ACCEPTANCE→DONE) cũng đi qua cùng luồng confirm.

Mỗi lần chuyển thành công tạo 1 bản ghi `TaskTransition` (id riêng) — hiển thị ở timeline "Lịch sử trạng thái" trên `task-detail.tsx`.

Ma trận hợp lệ (không có đường nào quay về `PENDING_APPROVAL`): `PENDING_APPROVAL→TODO`, `TODO→IN_PROGRESS`, `IN_PROGRESS→PENDING_ACCEPTANCE`, `PENDING_ACCEPTANCE→DONE|TODO`, `DONE→REJECTED`, `REJECTED→TODO` (xem `lib/workflow/can-transition.ts`).
