package com.smartdairy.exception;

public class OpenAIException extends Exception {
    private final int statusCode;
    private final String responseBody;

    public OpenAIException(String message, int statusCode, String responseBody) {
        super(message);
        this.statusCode = statusCode;
        this.responseBody = responseBody;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public String getResponseBody() {
        return responseBody;
    }
}
