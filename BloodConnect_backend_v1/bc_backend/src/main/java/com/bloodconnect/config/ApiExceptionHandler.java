package com.bloodconnect.config;
import java.util.Map;
import java.util.NoSuchElementException;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
@RestControllerAdvice public class ApiExceptionHandler {
 @ExceptionHandler({IllegalArgumentException.class, NoSuchElementException.class}) ResponseEntity<Map<String,String>> bad(Exception e){return ResponseEntity.badRequest().body(Map.of("error",e.getMessage()==null?"Invalid request":e.getMessage()));}
}
