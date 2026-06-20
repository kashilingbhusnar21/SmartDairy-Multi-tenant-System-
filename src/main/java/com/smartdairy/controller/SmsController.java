package com.smartdairy.controller;

import com.smartdairy.service.impl.SmsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SmsController {

    @Autowired
    private SmsService smsService;

    @GetMapping("/send-sms")
    public String sendSms() {
        String sid = smsService.sendSms(
                "+919356044178",
                "Hello from Smart Dairy Project"
        );

        return "SMS Sent Successfully. SID: " + sid;
    }
}