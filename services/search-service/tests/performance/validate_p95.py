"""Validate p95 latency from JMeter JTL results — HU023 PF-283."""
import csv
import sys
import pathlib

JTL_PATH = pathlib.Path(__file__).parent / "results" / "ci_results.jtl"
THRESHOLD_MS = 800


def main():
    if not JTL_PATH.exists():
        print(f"ERROR: JTL file not found at {JTL_PATH}")
        sys.exit(1)

    elapsed = []
    errors = 0
    with open(JTL_PATH, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get("success", "").strip().lower() == "true":
                elapsed.append(int(row["elapsed"]))
            else:
                errors += 1

    if not elapsed:
        print("ERROR: No successful samples found in JTL file")
        sys.exit(1)

    elapsed.sort()
    total = len(elapsed)
    min_ms = elapsed[0]
    max_ms = elapsed[-1]
    avg_ms = round(sum(elapsed) / total)
    p50 = elapsed[int(total * 0.50)]
    p90 = elapsed[int(total * 0.90)]
    p95 = elapsed[int(total * 0.95)]
    p99 = elapsed[int(total * 0.99)]

    sep = "=" * 42
    print(sep)
    print("  JMeter Latency Summary (CI mode)")
    print(sep)
    print(f"  Samples  : {total:>6}")
    print(f"  Errors   : {errors:>6}")
    print(f"  Min      : {min_ms:>6} ms")
    print(f"  Avg      : {avg_ms:>6} ms")
    print(f"  p50      : {p50:>6} ms")
    print(f"  p90      : {p90:>6} ms")
    print(f"  p95      : {p95:>6} ms  <-- threshold ({THRESHOLD_MS}ms)")
    print(f"  p99      : {p99:>6} ms")
    print(f"  Max      : {max_ms:>6} ms")
    print(sep)

    if p95 > THRESHOLD_MS:
        print(f"\nFAIL: p95 ({p95}ms) exceeds {THRESHOLD_MS}ms threshold")
        sys.exit(1)

    print(f"\nPASS: p95 ({p95}ms) is within {THRESHOLD_MS}ms threshold -- HU023 satisfied")


if __name__ == "__main__":
    main()

