package pe.edu.upeu.lamb.envio.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.edu.upeu.lamb.envio.dto.EnvioRequest;
import pe.edu.upeu.lamb.envio.dto.EnvioResponse;
import pe.edu.upeu.lamb.envio.entity.Envio;
import pe.edu.upeu.lamb.envio.event.EnvioEvento;
import pe.edu.upeu.lamb.envio.messaging.EnvioProducer;
import pe.edu.upeu.lamb.envio.repository.EnvioRepository;

import java.util.List;

@RestController
@RequestMapping("/api/v1/envios")
@RequiredArgsConstructor
public class EnvioController {

    private final EnvioRepository envioRepository;
    private final EnvioProducer envioProducer;

    @PostMapping
    public ResponseEntity<Void> solicitar(@Valid @RequestBody EnvioRequest request) {
        EnvioEvento evento = EnvioEvento.builder()
                .tipo("envio.solicitado")
                .referencia(request.getReferencia())
                .destino(request.getDestino())
                .peso(request.getPeso())
                .build();
        envioProducer.publicar(evento);
        return ResponseEntity.status(HttpStatus.ACCEPTED).build();
    }

    @GetMapping
    public List<EnvioResponse> listar() {
        return envioRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    private EnvioResponse toResponse(Envio envio) {
        return EnvioResponse.builder()
                .id(envio.getId())
                .referencia(envio.getReferencia())
                .destino(envio.getDestino())
                .peso(envio.getPeso())
                .estado(envio.getEstado().name())
                .creadoEn(envio.getCreadoEn())
                .build();
    }
}
