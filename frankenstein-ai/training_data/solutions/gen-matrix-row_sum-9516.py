# Task: gen-matrix-row_sum-9516 | Score: 100% | 2026-02-10T15:41:45.519753

def main():
  m, n = map(int, input().split())
  for _ in range(m):
    row = list(map(int, input().split()))
    print(sum(row))

if __name__ == "__main__":
  main()