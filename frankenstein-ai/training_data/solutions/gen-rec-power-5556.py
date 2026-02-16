# Task: gen-rec-power-5556 | Score: 100% | 2026-02-12T12:32:17.389805

def power(x, n):
  if n == 0:
    return 1
  else:
    return x * power(x, n-1)

x = int(input())
n = int(input())
print(power(x, n))