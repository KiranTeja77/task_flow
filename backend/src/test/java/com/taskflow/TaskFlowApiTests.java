package com.taskflow;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskflow.model.*;
import com.taskflow.repo.TaskRepository;
import com.taskflow.repo.UserRepository;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class TaskFlowApiTests {

    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired TaskRepository tasks;
    @Autowired PasswordEncoder encoder;
    @Autowired ObjectMapper json;

    User admin, member, other;

    @BeforeEach
    void setUp() {
        tasks.deleteAll();
        users.deleteAll();
        admin = users.save(new User("Admin User", "admin@test.com", encoder.encode("secret1"), Role.ADMIN));
        member = users.save(new User("Member One", "member@test.com", encoder.encode("secret1"), Role.MEMBER));
        other = users.save(new User("Member Two", "other@test.com", encoder.encode("secret1"), Role.MEMBER));
    }

    private String login(String email) throws Exception {
        String body = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"secret1\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return "Bearer " + json.readTree(body).get("token").asText();
    }

    private Task newTask(User assignee) {
        Task t = new Task();
        t.setTitle("Sample task");
        t.setAssignee(assignee);
        t.setDueDate(LocalDate.now().plusDays(3));
        return tasks.save(t);
    }

    @Test
    void loginReturnsToken() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@test.com\",\"password\":\"secret1\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.role").value("ADMIN"));
    }

    @Test
    void loginWithWrongPasswordIsRejected() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@test.com\",\"password\":\"nope\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void registerCreatesMember() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"New Person\",\"email\":\"new@test.com\",\"password\":\"secret1\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.role").value("MEMBER"));
    }

    @Test
    void tasksRequireAuthentication() throws Exception {
        mvc.perform(get("/api/tasks")).andExpect(status().isUnauthorized());
    }

    @Test
    void adminCanCreateTask() throws Exception {
        mvc.perform(post("/api/tasks").header("Authorization", login("admin@test.com"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Write docs\",\"priority\":\"HIGH\",\"assigneeId\":" + member.getId() + "}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Write docs"))
                .andExpect(jsonPath("$.status").value("TODO"))
                .andExpect(jsonPath("$.assigneeName").value("Member One"));
    }

    @Test
    void memberCannotCreateTask() throws Exception {
        mvc.perform(post("/api/tasks").header("Authorization", login("member@test.com"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"Nope\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void createTaskWithBlankTitleFailsValidation() throws Exception {
        mvc.perform(post("/api/tasks").header("Authorization", login("admin@test.com"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"  \"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void memberCanUpdateStatusOfOwnTask() throws Exception {
        Task t = newTask(member);
        mvc.perform(patch("/api/tasks/" + t.getId() + "/status").header("Authorization", login("member@test.com"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"DONE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DONE"));
    }

    @Test
    void memberCannotUpdateStatusOfSomeoneElsesTask() throws Exception {
        Task t = newTask(other);
        mvc.perform(patch("/api/tasks/" + t.getId() + "/status").header("Authorization", login("member@test.com"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"DONE\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanDeleteTaskButMemberCannot() throws Exception {
        Task t = newTask(member);
        mvc.perform(delete("/api/tasks/" + t.getId()).header("Authorization", login("member@test.com")))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/api/tasks/" + t.getId()).header("Authorization", login("admin@test.com")))
                .andExpect(status().isNoContent());
    }

    @Test
    void dashboardStatsCountOverdueTasks() throws Exception {
        Task late = newTask(member);
        late.setDueDate(LocalDate.now().minusDays(2));
        tasks.save(late);
        newTask(other);
        String body = mvc.perform(get("/api/dashboard/stats").header("Authorization", login("admin@test.com")))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        JsonNode n = json.readTree(body);
        org.junit.jupiter.api.Assertions.assertEquals(2, n.get("total").asInt());
        org.junit.jupiter.api.Assertions.assertEquals(1, n.get("overdue").asInt());
    }

    @Test
    void systemInfoAndHealthArePublic() throws Exception {
        mvc.perform(get("/api/system/info"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").isNotEmpty())
                .andExpect(jsonPath("$.buildNumber").isNotEmpty());
        mvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }
}
