# Task: gen-pattern-pyramid-6553 | Score: 100% | 2026-02-13T19:35:33.774457

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))