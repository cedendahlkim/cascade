# Task: gen-pattern-pyramid-9186 | Score: 100% | 2026-02-13T09:35:42.033403

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))