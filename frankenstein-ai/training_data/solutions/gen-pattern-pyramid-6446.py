# Task: gen-pattern-pyramid-6446 | Score: 100% | 2026-02-13T18:20:57.093438

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))