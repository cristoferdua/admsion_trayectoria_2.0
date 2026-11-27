package pe.edu.upeu.lamb.envio.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.lamb.envio.entity.Envio;

import java.util.Optional;

public interface EnvioRepository extends JpaRepository<Envio, Long> {

    boolean existsByReferencia(String referencia);

    Optional<Envio> findByReferencia(String referencia);
}
