package pe.edu.upeu.lamb.envio.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnvioResponse {

    private Long id;
    private String referencia;
    private String destino;
    private BigDecimal peso;
    private String estado;
    private LocalDateTime creadoEn;
}
