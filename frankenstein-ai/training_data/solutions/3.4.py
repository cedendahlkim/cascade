# Task: 3.4 | Score: 100% | 2026-02-13T18:30:38.235163

def factorial(n):
  if n == 0:
    return 1
  else:
    result = 1
    for i in range(1, n + 1):
      result *= i
    return result

n = int(input())
print(factorial(n))