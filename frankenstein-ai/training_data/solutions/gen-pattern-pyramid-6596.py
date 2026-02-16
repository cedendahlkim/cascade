# Task: gen-pattern-pyramid-6596 | Score: 100% | 2026-02-13T09:16:00.988367

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))