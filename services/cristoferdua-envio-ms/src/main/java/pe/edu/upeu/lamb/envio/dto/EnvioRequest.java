package pe.edu.upeu.lamb.envio.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class EnvioRequest {

    @NotBlank
    private String referencia;

    @NotBlank
    private String destino;

    @NotNull
    @Positive
    private BigDecimal peso;
}
