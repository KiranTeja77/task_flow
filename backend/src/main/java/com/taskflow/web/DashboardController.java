package com.taskflow.web;

import com.taskflow.model.Task;
import com.taskflow.model.TaskStatus;
import com.taskflow.repo.TaskRepository;
import com.taskflow.web.Dtos.*;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    private final TaskRepository tasks;

    public DashboardController(TaskRepository tasks) { this.tasks = tasks; }

    @GetMapping("/stats")
    public Stats stats() {
        List<Task> all = tasks.findAll();
        LocalDate today = LocalDate.now();
        long overdue = all.stream()
                .filter(t -> t.getStatus() != TaskStatus.DONE && t.getDueDate() != null && t.getDueDate().isBefore(today))
                .count();

        Map<String, Long> byMember = all.stream().collect(Collectors.groupingBy(
                t -> t.getAssignee() == null ? "Unassigned" : t.getAssignee().getName(),
                TreeMap::new, Collectors.counting()));
        List<Count> perMember = byMember.entrySet().stream().map(e -> new Count(e.getKey(), e.getValue())).toList();

        List<Count> split = Arrays.stream(TaskStatus.values())
                .map(s -> new Count(s.name(), count(all, s))).toList();

        return new Stats(all.size(), count(all, TaskStatus.IN_PROGRESS), count(all, TaskStatus.DONE),
                overdue, perMember, split);
    }

    private long count(List<Task> all, TaskStatus s) {
        return all.stream().filter(t -> t.getStatus() == s).count();
    }
}
