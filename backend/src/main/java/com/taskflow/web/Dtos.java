package com.taskflow.web;

import com.taskflow.model.*;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.List;

public final class Dtos {
    private Dtos() {}

    public record LoginRequest(@NotBlank String email, @NotBlank String password) {}

    public record RegisterRequest(@NotBlank String name, @Email @NotBlank String email,
                                  @NotBlank @Size(min = 6, message = "must be at least 6 characters") String password) {}

    /** Admin-created account; unlike self-registration the role can be chosen. */
    public record CreateUserRequest(@NotBlank String name, @Email @NotBlank String email,
                                    @NotBlank @Size(min = 6, message = "must be at least 6 characters") String password,
                                    @NotNull Role role) {}

    public record UserDto(Long id, String name, String email, Role role) {
        public static UserDto of(User u) { return new UserDto(u.getId(), u.getName(), u.getEmail(), u.getRole()); }
    }

    public record AuthResponse(String token, UserDto user) {}

    public record TaskRequest(@NotBlank @Size(max = 200) String title, @Size(max = 2000) String description,
                              TaskStatus status, Priority priority, Long assigneeId, LocalDate dueDate) {}

    public record StatusRequest(@NotNull TaskStatus status) {}

    public record TaskDto(Long id, String title, String description, TaskStatus status, Priority priority,
                          Long assigneeId, String assigneeName, LocalDate dueDate, boolean overdue) {
        public static TaskDto of(Task t) {
            boolean overdue = t.getDueDate() != null && t.getStatus() != TaskStatus.DONE
                    && t.getDueDate().isBefore(LocalDate.now());
            User a = t.getAssignee();
            return new TaskDto(t.getId(), t.getTitle(), t.getDescription(), t.getStatus(), t.getPriority(),
                    a == null ? null : a.getId(), a == null ? null : a.getName(), t.getDueDate(), overdue);
        }
    }

    public record Count(String name, long count) {}

    public record Stats(long total, long inProgress, long done, long overdue,
                        List<Count> perMember, List<Count> statusSplit) {}

    public record SystemInfo(String version, String buildNumber, String gitCommit) {}
}
