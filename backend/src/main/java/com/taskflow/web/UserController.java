package com.taskflow.web;

import com.taskflow.repo.UserRepository;
import com.taskflow.web.Dtos.UserDto;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserRepository users;

    public UserController(UserRepository users) { this.users = users; }

    @GetMapping
    public List<UserDto> list() {
        return users.findAll().stream().map(UserDto::of).toList();
    }
}
