package com.taskflow.web;

import com.taskflow.web.Dtos.SystemInfo;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/system")
public class SystemController {
    private final SystemInfo info;

    public SystemController(@Value("${app.version}") String version,
                            @Value("${app.build-number}") String build,
                            @Value("${app.git-commit}") String commit) {
        this.info = new SystemInfo(version, build, commit);
    }

    @GetMapping("/info")
    public SystemInfo info() { return info; }
}
