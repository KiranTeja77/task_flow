package com.taskflow;

import com.taskflow.model.*;
import com.taskflow.repo.TaskRepository;
import com.taskflow.repo.UserRepository;
import java.time.LocalDate;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import static com.taskflow.model.Priority.*;
import static com.taskflow.model.TaskStatus.*;

/** Creates demo users and tasks on first startup (empty database only). */
@Component
@ConditionalOnProperty(name = "app.seed", havingValue = "true")
public class DataSeeder implements CommandLineRunner {
    private final UserRepository users;
    private final TaskRepository tasks;
    private final PasswordEncoder encoder;

    public DataSeeder(UserRepository users, TaskRepository tasks, PasswordEncoder encoder) {
        this.users = users;
        this.tasks = tasks;
        this.encoder = encoder;
    }

    @Override
    public void run(String... args) {
        if (users.count() > 0) return;

        users.save(new User("Priya Sharma", "admin@taskflow.com", encoder.encode("Admin@123"), Role.ADMIN));
        User arjun = member("Arjun Mehta", "arjun@taskflow.com");
        User neha = member("Neha Iyer", "neha@taskflow.com");
        User rahul = member("Rahul Verma", "rahul@taskflow.com");
        User sneha = member("Sneha Kulkarni", "sneha@taskflow.com");

        add("Set up CI pipeline for backend", "Configure Jenkins job to run unit tests on every push.", DONE, HIGH, arjun, -12);
        add("Design database schema", "ER diagram for users and tasks, review with the team.", DONE, HIGH, neha, -15);
        add("Implement JWT authentication", "Login and register endpoints with role claims.", DONE, HIGH, arjun, -9);
        add("Write API documentation", "Document all REST endpoints with request/response examples.", IN_PROGRESS, MEDIUM, neha, 3);
        add("Fix login redirect bug", "Users land on a blank page after the token expires.", IN_PROGRESS, HIGH, rahul, -2);
        add("Build dashboard charts", "Bar chart per member and donut chart for status split.", IN_PROGRESS, MEDIUM, sneha, 4);
        add("Dockerize the frontend", "Multi-stage build with Nginx serving the static bundle.", DONE, MEDIUM, rahul, -6);
        add("Add input validation on forms", "Show inline errors for required fields.", TODO, MEDIUM, sneha, 6);
        add("Review pull request #42", "Check the task filtering changes before merge.", TODO, LOW, arjun, -1);
        add("Set up staging environment", "Provision a staging server and deploy with Docker Compose.", TODO, HIGH, rahul, 8);
        add("Write unit tests for task service", "Cover create, update and delete flows.", IN_PROGRESS, MEDIUM, arjun, 2);
        add("Update README with setup steps", "Add run instructions and screenshots.", TODO, LOW, neha, 10);
        add("Optimize slow task query", "Task list takes over a second with 500 rows.", TODO, MEDIUM, rahul, -4);
        add("Create onboarding checklist", "Checklist for new team members joining the project.", DONE, LOW, sneha, -8);
        add("Configure database backups", "Nightly pg_dump to a mounted volume.", TODO, HIGH, arjun, 5);
        add("Design empty state placeholders", "Simple placeholders for lists with no data.", DONE, LOW, sneha, -5);
        add("Sprint retrospective notes", "Summarize what went well and action items.", TODO, LOW, neha, 1);
        add("Integrate Docker Hub push", "Push tagged images from the Jenkins pipeline.", IN_PROGRESS, HIGH, rahul, 0);
        add("Accessibility check on board page", "Keyboard navigation and contrast review.", TODO, MEDIUM, sneha, 12);
        add("Rotate JWT secret", "Move the secret to environment config and rotate it.", TODO, HIGH, null, 7);
    }

    private User member(String name, String email) {
        return users.save(new User(name, email, encoder.encode("Member@123"), Role.MEMBER));
    }

    private void add(String title, String desc, TaskStatus status, Priority priority, User assignee, int dueInDays) {
        Task t = new Task();
        t.setTitle(title);
        t.setDescription(desc);
        t.setStatus(status);
        t.setPriority(priority);
        t.setAssignee(assignee);
        t.setDueDate(LocalDate.now().plusDays(dueInDays));
        tasks.save(t);
    }
}
