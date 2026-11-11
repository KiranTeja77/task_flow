package com.taskflow.web;

import com.taskflow.model.*;
import com.taskflow.repo.TaskRepository;
import com.taskflow.repo.UserRepository;
import com.taskflow.web.Dtos.*;
import jakarta.validation.Valid;
import java.util.Comparator;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {
    private final TaskRepository tasks;
    private final UserRepository users;

    public TaskController(TaskRepository tasks, UserRepository users) {
        this.tasks = tasks;
        this.users = users;
    }

    @GetMapping
    public List<TaskDto> list() {
        return tasks.findAll().stream()
                .sorted(Comparator.comparing(Task::getId))
                .map(TaskDto::of).toList();
    }

    @GetMapping("/{id}")
    public TaskDto get(@PathVariable Long id) {
        return TaskDto.of(find(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TaskDto create(@Valid @RequestBody TaskRequest req) {
        Task t = new Task();
        apply(t, req);
        return TaskDto.of(tasks.save(t));
    }

    @PutMapping("/{id}")
    public TaskDto update(@PathVariable Long id, @Valid @RequestBody TaskRequest req) {
        Task t = find(id);
        apply(t, req);
        return TaskDto.of(tasks.save(t));
    }

    /** Admins may change any task; members only the tasks assigned to them. */
    @PatchMapping("/{id}/status")
    public TaskDto updateStatus(@PathVariable Long id, @Valid @RequestBody StatusRequest req,
                                @AuthenticationPrincipal User user) {
        Task t = find(id);
        boolean owner = t.getAssignee() != null && t.getAssignee().getId().equals(user.getId());
        if (user.getRole() != Role.ADMIN && !owner) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only update your own tasks");
        }
        t.setStatus(req.status());
        return TaskDto.of(tasks.save(t));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        tasks.delete(find(id));
    }

    private Task find(Long id) {
        return tasks.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
    }

    private void apply(Task t, TaskRequest req) {
        t.setTitle(req.title().trim());
        t.setDescription(req.description());
        t.setStatus(req.status() == null ? TaskStatus.TODO : req.status());
        t.setPriority(req.priority() == null ? Priority.MEDIUM : req.priority());
        t.setDueDate(req.dueDate());
        t.setAssignee(req.assigneeId() == null ? null : users.findById(req.assigneeId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Assignee not found")));
    }
}
