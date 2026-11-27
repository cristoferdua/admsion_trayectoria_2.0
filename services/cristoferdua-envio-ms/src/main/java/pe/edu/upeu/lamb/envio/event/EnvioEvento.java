package pe.edu.upeu.lamb.envio.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnvioEvento {

    private String tipo;
    private String referencia;
    private String destino;
    private BigDecimal peso;
}
