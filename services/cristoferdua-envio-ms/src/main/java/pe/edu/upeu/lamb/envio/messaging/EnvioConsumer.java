package pe.edu.upeu.lamb.envio.messaging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import pe.edu.upeu.lamb.envio.entity.Envio;
import pe.edu.upeu.lamb.envio.entity.EstadoEnvio;
import pe.edu.upeu.lamb.envio.event.EnvioEvento;
import pe.edu.upeu.lamb.envio.repository.EnvioRepository;

@Slf4j
@Component
@RequiredArgsConstructor
public class EnvioConsumer {

    private final EnvioRepository envioRepository;
    private final EnvioProducer envioProducer;

    @KafkaListener(topics = "${app.kafka.topic.eventos}", groupId = "${spring.kafka.consumer.group-id}")
    public void consumir(EnvioEvento evento) {
        if (!"envio.solicitado".equals(evento.getTipo())) {
            return;
        }

        log.info("component=consumer tipo={} referencia={}", evento.getTipo(), evento.getReferencia());

        // Idempotencia: si ya existe, ignorar
        if (envioRepository.existsByReferencia(evento.getReferencia())) {
            log.warn("component=consumer referencia={} status=duplicado — ignorado", evento.getReferencia());
            return;
        }

        // Registrar en PENDIENTE
        Envio envio = Envio.builder()
                .referencia(evento.getReferencia())
                .destino(evento.getDestino())
                .peso(evento.getPeso())
                .estado(EstadoEnvio.PENDIENTE)
                .build();
        envioRepository.save(envio);

        // Decidir camino: fallo o feliz
        if ("SIN_COBERTURA".equals(evento.getDestino())) {
            envio.setEstado(EstadoEnvio.CANCELADO);
            envioRepository.save(envio);
            envioProducer.publicar(EnvioEvento.builder()
                    .tipo("envio.fallido")
                    .referencia(evento.getReferencia())
                    .destino(evento.getDestino())
                    .peso(evento.getPeso())
                    .build());
            log.info("component=consumer referencia={} estado=CANCELADO evento=envio.fallido", evento.getReferencia());
        } else {
            envio.setEstado(EstadoEnvio.DESPACHADO);
            envioRepository.save(envio);
            envioProducer.publicar(EnvioEvento.builder()
                    .tipo("envio.despachado")
                    .referencia(evento.getReferencia())
                    .destino(evento.getDestino())
                    .peso(evento.getPeso())
                    .build());
            log.info("component=consumer referencia={} estado=DESPACHADO evento=envio.despachado", evento.getReferencia());
        }
    }
}
