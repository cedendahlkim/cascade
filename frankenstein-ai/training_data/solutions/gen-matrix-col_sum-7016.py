# Task: gen-matrix-col_sum-7016 | Score: 100% | 2026-02-12T20:29:00.387602

def main():
  rows, cols = map(int, input().split())
  matrix = []
  for _ in range(rows):
    matrix.append(list(map(int, input().split())))

  col_sums = [0] * cols
  for j in range(cols):
    for i in range(rows):
      col_sums[j] += matrix[i][j]

  print(*col_sums)

if __name__ == "__main__":
  main()