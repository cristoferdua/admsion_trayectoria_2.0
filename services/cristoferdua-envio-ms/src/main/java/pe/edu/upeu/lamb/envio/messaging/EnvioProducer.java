package pe.edu.upeu.lamb.envio.messaging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import pe.edu.upeu.lamb.envio.event.EnvioEvento;

@Slf4j
@Component
@RequiredArgsConstructor
public class EnvioProducer {

    private final KafkaTemplate<String, EnvioEvento> kafkaTemplate;

    @Value("${app.kafka.topic.eventos}")
    private String topic;

    public void publicar(EnvioEvento evento) {
        kafkaTemplate.send(topic, evento.getReferencia(), evento)
                .whenComplete((resultado, ex) -> {
                    if (ex != null) {
                        log.error("component=producer topic={} tipo={} referencia={} status=error error=\"{}\"",
                                topic, evento.getTipo(), evento.getReferencia(), ex.getMessage());
                        return;
                    }
                    log.info("component=producer topic={} partition={} offset={} tipo={} referencia={} status=published",
                            resultado.getRecordMetadata().topic(),
                            resultado.getRecordMetadata().partition(),
                            resultado.getRecordMetadata().offset(),
                            evento.getTipo(), evento.getReferencia());
                });
    }
}
