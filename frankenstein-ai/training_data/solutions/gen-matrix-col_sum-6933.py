# Task: gen-matrix-col_sum-6933 | Score: 100% | 2026-02-10T15:41:23.631645

def main():
  m, n = map(int, input().split())
  matrix = []
  for _ in range(m):
    row = list(map(int, input().split()))
    matrix.append(row)
  
  col_sums = [0] * n
  for j in range(n):
    for i in range(m):
      col_sums[j] += matrix[i][j]
  
  print(*col_sums)

if __name__ == "__main__":
  main()