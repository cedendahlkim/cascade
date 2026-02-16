# Task: gen-pattern-pyramid-4868 | Score: 100% | 2026-02-13T18:52:04.108765

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))