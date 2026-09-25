package com.bloodconnect.dto;
import jakarta.validation.constraints.*;
public final class RequestDtos {
    private RequestDtos() {}
    public record CreateRequest(@NotBlank String patientName,@Min(1) @Max(120) int patientAge,@NotBlank String bloodGroup,@NotBlank String state,@NotBlank String district,@NotBlank String hospitalName,String hospitalAddress,String locationType,String location,boolean urgent) {}
}
