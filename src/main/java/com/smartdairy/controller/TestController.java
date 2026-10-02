package com.smartdairy.controller;


import org.springframework.web.bind.annotation.*;
@RestController
public class TestController {

    @GetMapping("/test")
    public String home(){
        return " backend running succesfully ";
    }
}
