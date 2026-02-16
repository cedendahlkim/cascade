# Task: gen-pattern-pyramid-4318 | Score: 100% | 2026-02-13T19:47:07.764922

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))