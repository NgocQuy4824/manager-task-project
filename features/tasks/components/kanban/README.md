# Kanban — 6 cột tuyến tính

Cột: `PENDING_APPROVAL → TODO → IN_PROGRESS → PENDING_ACCEPTANCE → DONE → REJECTED` (định nghĩa ở `KANBAN_STATUSES` trong `lib/constants.ts`).

Thực thi trong `features/tasks/components/task-kanban.tsx`: `DndContext` + `SortableContext` (dnd-kit, PointerSensor distance 8px), `Column` (droppable) và `SortableCard` (draggable). Kéo thả không tự chuyển — `handleDragEnd` chỉ tính `targetStatus` rồi gọi `onRequestMove(taskId, from, to)` để trang `tasks-page.tsx` mở `ConfirmTransitionDialog` (yêu cầu lý do khi trả về làm lại hoặc từ chối). Chỉ khi người dùng xác nhận mới gọi `POST /api/tasks/[id]/transition`; hủy thì board giữ nguyên.

Card có nút nhanh "Duyệt" (PENDING_APPROVAL→TODO) và "Nghiệm thu" (PENDING_ACCEPTANCE→DONE) cũng đi qua cùng luồng confirm.

Mỗi lần chuyển thành công tạo 1 bản ghi `TaskTransition` (id riêng) — hiển thị ở timeline "Lịch sử trạng thái" trên `task-detail.tsx`.

Ma trận hợp lệ (không có đường nào quay về `PENDING_APPROVAL`): `PENDING_APPROVAL→TODO|REJECTED`, `TODO→IN_PROGRESS`, `IN_PROGRESS→PENDING_ACCEPTANCE|TODO`, `PENDING_ACCEPTANCE→DONE|IN_PROGRESS|REJECTED`, `DONE→IN_PROGRESS`, `REJECTED→TODO` (xem `lib/workflow/can-transition.ts`).

Trạng thái `REJECTED` chỉ vào được từ 2 cổng phê duyệt (Chờ duyệt, Chờ nghiệm thu), qua API transition với lý do bắt buộc; PATCH không được set `REJECTED` trực tiếp. Người có quyền từ chối: ở Chờ duyệt là creator/assignee/MANAGER (hoặc ADMIN), ở Chờ nghiệm thu là creator/MANAGER (hoặc ADMIN). Lý do từ chối lưu vào `reviewNote` và lịch sử.
