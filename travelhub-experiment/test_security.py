"""
Experimento: Seguridad - Detección y bloqueo de fraude por velocidad
Valida que el sistema bloquee una IP después de 15 intentos en 2 minutos.

Uso:
    1. Levanta los servicios: docker compose up --build -d
    2. Espera ~5s a que estén listos
    3. Ejecuta: python test_security.py
"""

import requests
import time

GATEWAY_URL   = "http://localhost/pay"
FRAUD_LOGS_URL = "http://localhost:8001/logs"

ATTACKER_IP   = "10.10.10.1"
MAX_ATTEMPTS  = 15
TOTAL_REQUESTS = 20

PAYLOAD = {
    "card_number": "4111111111111111",
    "amount": 99.99,
    "merchant_id": "merchant_001",
    "ip_address": ATTACKER_IP,  # incluido para validación del schema
}
HEADERS = {"X-Client-IP": ATTACKER_IP}


def run_experiment():
    print()
    print("=" * 60)
    print("  EXPERIMENTO: Bloqueo de Fraude por Velocidad (EC003)")
    print("=" * 60)
    print(f"  IP atacante  : {ATTACKER_IP}")
    print(f"  Umbral       : {MAX_ATTEMPTS} intentos / 2 min")
    print(f"  Total envíos : {TOTAL_REQUESTS}")
    print("=" * 60)
    print()

    first_request_time = None
    block_detected_time = None
    block_attempt = None

    for i in range(1, TOTAL_REQUESTS + 1):
        t0 = time.time()
        try:
            resp = requests.post(GATEWAY_URL, json=PAYLOAD, headers=HEADERS, timeout=5)
            elapsed = time.time() - t0

            if i == 1:
                first_request_time = t0

            if resp.status_code == 200:
                data = resp.json()
                print(f"  Intento {i:2d}: ✅ APROBADO   (HTTP 200) "
                      f"| intentos en Redis: {data.get('attempts', '?')} "
                      f"| {elapsed:.3f}s")

            elif resp.status_code == 403:
                if block_detected_time is None:
                    block_detected_time = time.time()
                    block_attempt = i
                    print(f"  Intento {i:2d}: 🚫 BLOQUEADO (HTTP 403) ← BLOQUEO ACTIVADO | {elapsed:.3f}s")
                else:
                    print(f"  Intento {i:2d}: 🚫 BLOQUEADO (HTTP 403) | {elapsed:.3f}s")

            else:
                print(f"  Intento {i:2d}: ⚠️  HTTP {resp.status_code} | {elapsed:.3f}s")

        except requests.exceptions.ConnectionError:
            print(f"  Intento {i:2d}: ❌ Sin conexión — ¿están corriendo los servicios?")
            print()
            print("  Levanta los servicios con:  docker compose up --build -d")
            return
        except Exception as e:
            print(f"  Intento {i:2d}: ❌ Error — {e}")

    # ── Resumen ─────────────────────────────────────────────────────────────
    print()
    print("=" * 60)
    print("  RESULTADO")
    print("=" * 60)

    if block_detected_time and first_request_time:
        detection_secs = block_detected_time - first_request_time
        print(f"  Bloqueo en intento #{block_attempt}")
        print(f"  Tiempo hasta el bloqueo : {detection_secs:.3f}s")
        if detection_secs < 2.0:
            print("  ✅ < 2s  →  CUMPLE con EC003")
        else:
            print("  ❌ ≥ 2s  →  NO cumple con EC003")
    else:
        print("  ❌ No se detectó bloqueo en los 20 intentos")

    # ── Consulta al Fraud Service ────────────────────────────────────────────
    print()
    print("  Estado en Fraud Service:")
    try:
        r = requests.get(f"{FRAUD_LOGS_URL}/{ATTACKER_IP}", timeout=5)
        d = r.json()
        bloqueado = "SÍ 🚫" if d.get("blocked") else "NO"
        print(f"    IP             : {d.get('ip')}")
        print(f"    Intentos Redis : {d.get('attempts')}")
        print(f"    Bloqueado      : {bloqueado}")
    except Exception as e:
        print(f"    No se pudo consultar el Fraud Service: {e}")

    print("=" * 60)
    print()


if __name__ == "__main__":
    run_experiment()

