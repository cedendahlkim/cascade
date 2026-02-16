# Task: gen-pattern-pyramid-9409 | Score: 100% | 2026-02-13T18:43:37.057965

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))