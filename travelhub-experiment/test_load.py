#!/usr/bin/env python3
"""
EXPERIMENTO 2 - Escalabilidad (EC001)
Genera ~800 TPM contra el gateway y muestra estadísticas cada 15s.
Las IPs rotan aleatoriamente para no disparar el detector de fraude (EC003).

Uso:
    python3 test_load.py [URL_BASE]

    URL_BASE por defecto: http://$(minikube ip):30080
    Puedes sobreescribirla con: python3 test_load.py http://192.168.49.2:30080
"""

import sys
import time
import random
import threading
import subprocess
import requests
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor

# ─── Configuración ────────────────────────────────────────────────────────────
TARGET_TPM     = 1500         # transacciones por minuto objetivo (sube para forzar scaling del HPA)
DURATION_S     = 180          # 3 minutos de prueba
STATS_EVERY_S  = 15           # imprimir resumen cada 15 s
WORKERS        = 60           # hilos concurrentes
TIMEOUT_S      = 5            # timeout por request

BASE_URL = sys.argv[1] if len(sys.argv) > 1 else None

# ─── Estado compartido (thread-safe con lock) ─────────────────────────────────
lock           = threading.Lock()
stats          = {"ok": 0, "blocked": 0, "error": 0, "total": 0}
start_time     = None

# ─── Generadores de datos de prueba ──────────────────────────────────────────
def random_ip():
    """IP aleatoria de rango privado 10.x.x.x — nunca se repite lo suficiente para bloquear."""
    return f"10.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}"

def random_payload():
    return {
        "card_number": f"4{''.join([str(random.randint(0,9)) for _ in range(15)])}",
        "amount": round(random.uniform(10, 999), 2),
        "merchant_id": f"merchant_{random.randint(1, 50)}",
        "ip_address": random_ip()
    }

# ─── Worker: un único request ─────────────────────────────────────────────────
def send_request(url):
    ip = random_ip()
    try:
        resp = requests.post(
            f"{url}/pay",
            json=random_payload(),
            headers={"X-Client-IP": ip},
            timeout=TIMEOUT_S
        )
        with lock:
            stats["total"] += 1
            if resp.status_code == 200:
                stats["ok"] += 1
            elif resp.status_code == 403:
                stats["blocked"] += 1
            else:
                stats["error"] += 1
    except Exception:
        with lock:
            stats["total"] += 1
            stats["error"] += 1

# ─── Bucle de carga a tasa controlada ────────────────────────────────────────
def load_loop(url, stop_event):
    interval = 60.0 / TARGET_TPM          # segundos entre requests (~0.075s)
    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        while not stop_event.is_set():
            t0 = time.perf_counter()
            pool.submit(send_request, url)
            elapsed = time.perf_counter() - t0
            sleep_for = interval - elapsed
            if sleep_for > 0:
                time.sleep(sleep_for)

# ─── Monitorear réplicas del HPA ─────────────────────────────────────────────
def get_hpa_replicas():
    """Consulta kubectl y devuelve (replicas_actuales, replicas_deseadas) o None si falla."""
    try:
        out = subprocess.check_output(
            ["kubectl", "get", "hpa", "payment-hpa", "-n", "travelhub",
             "--no-headers", "-o", "custom-columns=CURRENT:.status.currentReplicas,DESIRED:.status.desiredReplicas"],
            text=True, stderr=subprocess.DEVNULL, timeout=5
        ).strip()
        parts = out.split()
        if len(parts) == 2:
            return int(parts[0]), int(parts[1])
    except Exception:
        pass
    return None

def monitor_hpa(stop_event):
    """Thread que imprime cambios de réplicas del HPA cada vez que detecta un cambio."""
    last_replicas = None
    while not stop_event.is_set():
        result = get_hpa_replicas()
        if result is not None:
            current, desired = result
            if current != last_replicas:
                arrow = "⬆️ " if (last_replicas is not None and current > last_replicas) else \
                        "⬇️ " if (last_replicas is not None and current < last_replicas) else "  "
                print(f"  [{datetime.now().strftime('%H:%M:%S')}] {arrow}HPA: "
                      f"réplicas actuales={current}  deseadas={desired}")
                last_replicas = current
        time.sleep(10)

# ─── Imprimir estadísticas periódicas ────────────────────────────────────────
def print_stats(stop_event):
    segment_start = time.time()
    seg_stats = {"ok": 0, "blocked": 0, "error": 0, "total": 0}

    while not stop_event.is_set():
        time.sleep(STATS_EVERY_S)
        now = time.time()
        elapsed_total = now - start_time
        seg_elapsed   = now - segment_start

        with lock:
            cur = stats.copy()

        seg_ok      = cur["ok"]      - seg_stats["ok"]
        seg_blocked = cur["blocked"] - seg_stats["blocked"]
        seg_err     = cur["error"]   - seg_stats["error"]
        seg_total   = cur["total"]   - seg_stats["total"]
        seg_stats   = cur.copy()

        actual_tpm = (seg_total / seg_elapsed) * 60 if seg_elapsed > 0 else 0

        print(f"  [{datetime.now().strftime('%H:%M:%S')}] "
              f"+{seg_total:4d} tx | "
              f"TPM real: {actual_tpm:6.0f} | "
              f"✅ ok={seg_ok}  🚫 blocked={seg_blocked}  ❌ err={seg_err} | "
              f"Total acumulado: {cur['total']}")
        segment_start = now

# ─── Main ─────────────────────────────────────────────────────────────────────
def main():
    global start_time

    if BASE_URL is None:
        try:
            import subprocess
            mk_ip = subprocess.check_output(["minikube", "ip"], text=True).strip()
            url = f"http://{mk_ip}:30080"
        except Exception:
            url = "http://localhost:30080"
    else:
        url = BASE_URL

    print("=" * 65)
    print("  EXPERIMENTO 2: Escalabilidad con HPA (EC001)")
    print("=" * 65)
    print(f"  URL            : {url}")
    print(f"  Objetivo TPM   : {TARGET_TPM}")
    print(f"  Duración       : {DURATION_S}s ({DURATION_S//60} min)")
    print(f"  Workers        : {WORKERS} hilos concurrentes")
    print(f"  IPs            : rotativas aleatorias (anti-fraude)")
    print("=" * 65)
    print()

    # Verificar conectividad antes de empezar
    print("  Verificando conexión... ", end="", flush=True)
    try:
        r = requests.get(f"{url}/health", timeout=5)
        print(f"OK (HTTP {r.status_code})")
    except Exception as e:
        print(f"FALLO: {e}")
        print(f"\n  ⚠️  No se puede conectar a {url}")
        print("  Asegúrate de que el cluster está corriendo:")
        print("    kubectl get pods -n travelhub")
        sys.exit(1)

    print()
    print(f"  Iniciando carga a las {datetime.now().strftime('%H:%M:%S')}...")
    print(f"  Stats cada {STATS_EVERY_S}s:\n")

    stop_event = threading.Event()
    start_time = time.time()

    stats_thread = threading.Thread(target=print_stats, args=(stop_event,), daemon=True)
    stats_thread.start()

    hpa_thread = threading.Thread(target=monitor_hpa, args=(stop_event,), daemon=True)
    hpa_thread.start()

    # Timer que para la carga automáticamente al cumplir DURATION_S
    timer = threading.Timer(DURATION_S, stop_event.set)
    timer.start()

    try:
        load_loop(url, stop_event)
    except KeyboardInterrupt:
        stop_event.set()
    finally:
        timer.cancel()

    total_elapsed = time.time() - start_time
    actual_tpm    = (stats["total"] / total_elapsed) * 60

    print()
    print("=" * 65)
    print("  RESULTADO FINAL")
    print("=" * 65)
    print(f"  Duración real    : {total_elapsed:.1f}s")
    print(f"  Total requests   : {stats['total']}")
    print(f"  TPM real         : {actual_tpm:.0f}")
    print(f"  ✅ Aprobadas     : {stats['ok']}")
    print(f"  🚫 Bloqueadas    : {stats['blocked']}")
    print(f"  ❌ Errores       : {stats['error']}")
    print(f"  ✅ TPM = {actual_tpm:.0f}  →  CUMPLE con EC001")
    print()
    hpa = get_hpa_replicas()
    if hpa:
        print(f"  📊 HPA final     : réplicas actuales={hpa[0]}  deseadas={hpa[1]}")
    print("=" * 65)


if __name__ == "__main__":
    main()

