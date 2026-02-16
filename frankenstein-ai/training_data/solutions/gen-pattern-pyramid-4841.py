# Task: gen-pattern-pyramid-4841 | Score: 100% | 2026-02-13T12:11:59.654698

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))